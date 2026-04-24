# app.py - Production FastAPI Backend with Alembic

import os
import logging
import profile
import re
import subprocess
from datetime import datetime, timedelta
from typing import Optional
from unittest import result
from dotenv import load_dotenv
from fastapi import Response 
import uvicorn
from fastapi import FastAPI, Depends, HTTPException,Request, File, UploadFile, Form, Response, Cookie
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from sqlalchemy import create_engine, Column, Integer, String, DateTime, ForeignKey, Text, Enum
from sqlalchemy.orm import sessionmaker, declarative_base, Session, relationship
from passlib.context import CryptContext
from jose import jwt, JWTError
from pathlib import Path
from sqlalchemy import inspect
import random
from sqlalchemy import JSON
from sqlalchemy import func
import json

from pathlib import Path
from pydantic import BaseModel

# Load environment variables
load_dotenv()

# =========================
# CONFIGURATION
# =========================
DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise Exception("DATABASE_URL is not set")
    
SECRET_KEY = os.getenv("SECRET_KEY", "supersecretkey")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
UPLOAD_DIR = os.getenv("UPLOAD_DIR", "uploads")
ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif"]
ALLOWED_RESUME_TYPES = ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"]
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5 MB
ENVIRONMENT = os.getenv("ENVIRONMENT", "development")  # "production" or "development"

# Create upload directories
Path(f"{UPLOAD_DIR}/images").mkdir(parents=True, exist_ok=True)
Path(f"{UPLOAD_DIR}/resumes").mkdir(parents=True, exist_ok=True)

# 🔴 ADD BELOW CONFIG
otp_store = {}  # {email/mobile: {otp, expires}}

# =========================
# LOGGING
# =========================
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# =========================
# DATABASE SETUP (SQLAlchemy)
# =========================
engine = create_engine(
    DATABASE_URL,
    echo=False,
    pool_pre_ping=True
)
SessionLocal = sessionmaker(bind=engine)
Base = declarative_base()

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# ALLOWED_DEPARTMENTS

ALLOWED_DEPARTMENTS = [
    "AERO",
    "BME",
    "CIVIL",
    "ARCH",
    "CSE",
    "CSE-CS",
    "CSE-AIML",
    "ECE",
    "EEE",
    "MECH",
    "BT",
    "CHEM",
    "IT",
    "AI-DS",
    "CSBS",
    "ME-COMM",
    "ME-CSE",
    "ME-DESIGN",
    "ME-POWER",
    "ME-STRUCT",
    "MBA",
    "MBA-LOG",
    "MCA",
    "PHD-CSE",
    "PHD-ECE",
    "PHD-MECH",
    "PHD-CHEM"
]

# =========================
# MODELS
# =========================
class DashboardStats(BaseModel):
    projects: int
    mentors: int
    students: int

class RegisterRequest(BaseModel):
    id: str
    email: str
    password: str
    role: str
    
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True)
    user_id = Column(String(50), unique=True, nullable=False)
    email = Column(String(100), unique=True, nullable=False)
    password = Column(String(255), nullable=False)
    role = Column(Enum("student", "mentor", "admin"), default="student")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    # 🔴 1. Add Refresh Token Fields (DB)
    refresh_token = Column(String(500), nullable=True)

    profile = relationship("UserProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    owned_projects = relationship("Project", back_populates="owner", foreign_keys="Project.created_by")
    project_members = relationship("ProjectMember", back_populates="user")


class UserProfile(Base):
    __tablename__ = "user_profiles"

    id = Column(Integer, primary_key=True)
    user_id = Column(String(50), ForeignKey("users.user_id", ondelete="CASCADE"), unique=True)

    name = Column(String(100))
    register_no = Column(String(20))
    email = Column(String(100))
    mobile = Column(String(20))
    dob = Column(String(20))
    gender = Column(String(10))
    bio = Column(Text)
    skills = Column(Text)  # ADD THIS
    degree = Column(String(50))
    department = Column(String(100))
    year = Column(String(10))
    batch = Column(String(20))
    github = Column(String(200))
    linkedin = Column(String(200))
    whatsapp = Column(String(20))
    image_url = Column(String(200))
    resume_url = Column(String(200))

    user = relationship("User", back_populates="profile")


class EmailOTPRequest(BaseModel):
    email: str

class VerifyEmailOTPRequest(BaseModel):
    email: str
    otp: str

class MobileOTPRequest(BaseModel):
    mobile: str

class VerifyMobileOTPRequest(BaseModel):
    mobile: str
    otp: str


class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True)
    title = Column(String(200), nullable=False)
    description = Column(Text)

    # 🔥 NEW FIELDS
    departments = Column(JSON, nullable=True)
    required_members = Column(Integer, default=1)
    expected_completion = Column(String(20))

    status = Column(Enum("pending", "active", "closed", "completed", "archived"), default="pending")
    created_by = Column(String(50), ForeignKey("users.user_id", ondelete="CASCADE"))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    owner = relationship("User", foreign_keys=[created_by], back_populates="owned_projects")
    members = relationship("ProjectMember", back_populates="project", cascade="all, delete-orphan")

class CreateProjectRequest(BaseModel):
    title: str
    description: str
    departments: list[str]
    required_members: int
    expected_completion: str


class ProjectMember(Base):
    __tablename__ = "project_members"

    id = Column(Integer, primary_key=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"))
    user_id = Column(String(50), ForeignKey("users.user_id", ondelete="CASCADE"))
    role = Column(Enum("owner", "member"), default="member")
    joined_at = Column(DateTime, default=datetime.utcnow)

    project = relationship("Project", back_populates="members")
    user = relationship("User", back_populates="project_members")

# =========================
# SCHEMAS (Pydantic)
# =========================
class LoginRequest(BaseModel):
    id: str
    password: str
    role: str

class LoginResponse(BaseModel):
    access_token: str
    role: str

class ProfileResponse(BaseModel):
    name: Optional[str] = None
    registerNo: Optional[str] = None
    email: Optional[str] = None
    mobile: Optional[str] = None
    dob: Optional[str] = None
    gender: Optional[str] = None
    bio: Optional[str] = None
    skills: Optional[str] = None
    degree: Optional[str] = None
    department: Optional[str] = None
    year: Optional[str] = None
    batch: Optional[str] = None
    github: Optional[str] = None
    linkedin: Optional[str] = None
    whatsapp: Optional[str] = None
    image: Optional[str] = None
    resume: Optional[str] = None

class PasswordChange(BaseModel):
    currentPassword: str
    newPassword: str

class ProjectStats(BaseModel):
    myProjects: int
    myCompleted: int
    memberProjects: int
    memberCompleted: int


class JoinRequest(Base):
    __tablename__ = "join_requests"

    id = Column(Integer, primary_key=True)

    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"))

    user_id = Column(String(50), ForeignKey("users.user_id", ondelete="CASCADE"))
    # user_id = receiver (mentor or project owner)

    requester_id = Column(String(50))  
    # 🔴 who sent the request (student)

    status = Column(
        Enum("pending", "accepted", "rejected", "cancelled"),
        default="pending"
    )

    reason = Column(String(255), nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)

# =========================
# Mentor Requests
# =========================
class MentorRequest(Base):
    __tablename__ = "mentor_requests"

    id = Column(Integer, primary_key=True)

    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"))
    owner_id = Column(String(50), ForeignKey("users.user_id", ondelete="CASCADE"))
    mentor_id = Column(String(50), ForeignKey("users.user_id", ondelete="CASCADE"))

    message = Column(Text, nullable=True)

    status = Column(
        Enum("pending", "accepted", "rejected"),
        default="pending"
    )

    created_at = Column(DateTime, default=datetime.utcnow)

    project = relationship("Project")


# =========================
# Project Mentors
# =========================
class ProjectMentor(Base):
    __tablename__ = "project_mentors"

    id = Column(Integer, primary_key=True)

    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"))
    mentor_id = Column(String(50), ForeignKey("users.user_id", ondelete="CASCADE"))

    added_at = Column(DateTime, default=datetime.utcnow)

    project = relationship("Project")

class ProjectCompletionRequest(Base):
    __tablename__ = "project_completion_requests"

    id = Column(Integer, primary_key=True)

    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"))
    owner_id = Column(String(50), ForeignKey("users.user_id", ondelete="CASCADE"))

    status = Column(
        Enum("pending", "accepted", "rejected"),
        default="pending"
    )

    created_at = Column(DateTime, default=datetime.utcnow)   

class TaskMessage(Base):
    __tablename__ = "task_messages"

    id = Column(Integer, primary_key=True)

    project_id = Column(
        Integer,
        ForeignKey("projects.id", ondelete="CASCADE")
    )

    sender_id = Column(String(50))
    sender_role = Column(String(20))

    message = Column(Text)

    created_at = Column(DateTime, default=datetime.utcnow)     

# =========================
# UTILITY FUNCTIONS
# =========================
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def generate_otp():
    return str(random.randint(100000, 999999))        

def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def validate_password(password: str):
    if (
        len(password) < 8
        or not re.search(r"[A-Z]", password)
        or not re.search(r"[a-z]", password)
        or not re.search(r"[0-9]", password)
        or not re.search(r"[!@#$%^&*(),.?\":{}|<>]", password)
    ):
        raise HTTPException(
            status_code=400,
            detail="Password must be 8+ chars with uppercase, lowercase, number, and special character"
        )
    
# 🔴 2. Update Token Creation (Separate functions)
def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    to_encode["exp"] = datetime.utcnow() + timedelta(minutes=15)  # short lifetime
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def create_refresh_token(data: dict) -> str:
    to_encode = data.copy()
    to_encode["exp"] = datetime.utcnow() + timedelta(days=7)  # longer lifetime
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)



async def save_upload_file(upload_file: UploadFile, subdir: str) -> str:
    if not upload_file:
        return None

    content_type = upload_file.content_type

    # ✅ Validate file type
    if subdir == "images" and content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(400, "Invalid image format (jpeg, png, gif only)")

    if subdir == "resumes" and content_type not in ALLOWED_RESUME_TYPES:
        raise HTTPException(400, "Invalid resume format (pdf, doc, docx only)")

    # ✅ Read file
    file_content = await upload_file.read()

    # ✅ Validate size
    if len(file_content) > MAX_FILE_SIZE:
        raise HTTPException(
            400,
            f"File too large. Max size {MAX_FILE_SIZE // (1024*1024)} MB"
        )

    # ✅ Generate safe filename
    filename = f"{datetime.utcnow().timestamp()}_{upload_file.filename.replace(' ', '_')}"

    file_path = Path(UPLOAD_DIR) / subdir / filename

    # ✅ Save file
    with open(file_path, "wb") as f:
        f.write(file_content)

    # ✅ Return URL
    return f"/uploads/{subdir}/{filename}"

# =========================
# JWT AUTH DEPENDENCY
# =========================
security = HTTPBearer()

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    token = credentials.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(401, "Invalid token")
    except JWTError:
        raise HTTPException(401, "Invalid token")
    user = db.query(User).filter(User.user_id == user_id).first()
    if not user:
        raise HTTPException(404, "User not found")
    return user

# =========================
# AUTO MIGRATION FUNCTION (DEVELOPMENT ONLY)
# =========================
def run_migrations():
    """Run Alembic migrations automatically in development mode."""
    try:
        # Generate migration if any changes detected
        subprocess.run(["alembic", "revision", "--autogenerate", "-m", "auto"], check=True, capture_output=True)
        # Apply pending migrations
        subprocess.run(["alembic", "upgrade", "head"], check=True)
        logger.info("✅ Database migrations applied successfully.")
    except subprocess.CalledProcessError as e:
        # No changes, ignore error
        if "No changes" in str(e.stderr):
            logger.info("No database changes detected.")
        else:
            logger.error(f"Migration error: {e}")

# =========================
# FASTAPI APP
# =========================
app = FastAPI(title="Project Collaboration Portal API", version="1.0")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 🔥 allow all (for dev/ngrok)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve static files (uploads)
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

# =========================
# STARTUP EVENT
# =========================
@app.on_event("startup")
def startup_event():
    logger.info("🚀 App started")

    # 🔥 CREATE TABLES AUTOMATICALLY
    Base.metadata.create_all(bind=engine)

# =========================
# ENDPOINTS
# =========================

# --- Authentication ---
# ================= REGISTER =================
@app.post("/api/auth/register")
def register(data: RegisterRequest, db: Session = Depends(get_db)):

    # normalize input
    user_id = data.id.strip()
    email = data.email.strip().lower()
    role = data.role.strip().lower()

    # validate password
    validate_password(data.password)

    # 🔒 allow only student and mentor
    allowed_roles = ["student", "mentor"]

    if role not in allowed_roles:
        raise HTTPException(
            status_code=400,
            detail="Invalid role. Allowed roles: student, mentor"
        )

    # check existing user_id
    existing_user = db.query(User).filter(User.user_id == user_id).first()
    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="User ID already exists"
        )

    # check existing email
    existing_email = db.query(User).filter(User.email == email).first()
    if existing_email:
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )

    # create user
    new_user = User(
        user_id=user_id,
        email=email,
        password=hash_password(data.password),
        role=role
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return {
        "message": f"{role} registered successfully"
    }

# ================= LOGIN =================
@app.post("/api/auth/login", response_model=LoginResponse)
def login(data: LoginRequest, response: Response, db: Session = Depends(get_db)):

    user_id = data.id.strip()

    user = db.query(User).filter(
        User.user_id == user_id,
        User.role == data.role
    ).first()

    if not user:
        raise HTTPException(
            status_code=403,
            detail=f"This account is not registered as {data.role}"
        )

    if not verify_password(data.password, user.password):
        raise HTTPException(
            status_code=401,
            detail="Wrong password"
        )

    # create tokens
    access_token = create_access_token({
        "sub": user.user_id,
        "role": user.role
    })

    refresh_token = create_refresh_token({
        "sub": user.user_id
    })

    # store refresh token
    user.refresh_token = refresh_token
    db.commit()

    # set cookie
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=False,   # change to True in production
        samesite="lax",
        max_age=7 * 24 * 60 * 60
    )

    return {
        "access_token": access_token,
        "role": user.role
    }    

# ================= REFRESH TOKEN =================
@app.post("/api/auth/refresh")
def refresh_token(
    response: Response,
    refresh_token: Optional[str] = Cookie(None),
    db: Session = Depends(get_db)
):
    if not refresh_token:
        raise HTTPException(401, "Missing refresh token")

    try:
        payload = jwt.decode(refresh_token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
    except JWTError:
        raise HTTPException(401, "Invalid refresh token")

    user = db.query(User).filter(User.user_id == user_id).first()

    if not user or user.refresh_token != refresh_token:
        raise HTTPException(401, "Invalid session")

    # ✅ NEW: rotate refresh token
    new_refresh_token = create_refresh_token({"sub": user.user_id})
    user.refresh_token = new_refresh_token
    db.commit()

    # ✅ NEW: update cookie
    response.set_cookie(
        key="refresh_token",
        value=new_refresh_token,
        httponly=True,
        secure=False,
        samesite="lax",
        max_age=7 * 24 * 60 * 60,

    )

    # new access token
    new_access_token = create_access_token({
        "sub": user.user_id,
        "role": user.role
    })

    return {"access_token": new_access_token}

# ================= LOGOUT =================
@app.post("/api/auth/logout")
def logout(
    response: Response,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Log out: clear refresh token from DB and delete cookie."""
    current_user.refresh_token = None
    db.commit()
    response.delete_cookie("refresh_token")
    return {"message": "Logged out successfully"}

# ================= GET CURRENT USER =================
@app.get("/api/auth/me")
def get_me(current_user: User = Depends(get_current_user)):
    return {
        "user_id": current_user.user_id,
        "role": current_user.role
    }
# ================= Send OTP Email =================
@app.post("/api/auth/send-otp")
def send_email_otp(data: EmailOTPRequest):
    email = data.email.strip().lower()

    otp = generate_otp()

    otp_store[email] = {
        "otp": otp,
        "expires": datetime.utcnow() + timedelta(minutes=5)
    }

    print(f"📧 EMAIL OTP for {email}: {otp}")

    return {"message": "OTP sent"}

# ================= Verify OTP Email =================
@app.post("/api/auth/verify-email-otp")
def verify_email_otp(data: VerifyEmailOTPRequest):
    email = data.email.strip().lower()
    otp = data.otp.strip()

    print("VERIFY EMAIL:", email)
    print("OTP STORE:", otp_store)

    record = otp_store.get(email)

    if not record:
        raise HTTPException(400, "OTP not found")

    if record["otp"] != otp:
        raise HTTPException(400, "Invalid OTP")

    if datetime.utcnow() > record["expires"]:
        raise HTTPException(400, "OTP expired")

    return {"message": "Email verified"}

# ================= Send OTP Mobile =================
@app.post("/api/auth/send-mobile-otp")
def send_mobile_otp(data: MobileOTPRequest):
    mobile = data.mobile.strip()

    otp = generate_otp()

    otp_store[mobile] = {
        "otp": otp,
        "expires": datetime.utcnow() + timedelta(minutes=5)
    }

    print(f"📱 MOBILE OTP for {mobile}: {otp}")

    return {"message": "OTP sent"}

# ================= Verify OTP Mobile =================
@app.post("/api/auth/verify-mobile-otp")
def verify_mobile_otp(data: VerifyMobileOTPRequest):
    mobile = data.mobile.strip()
    otp = data.otp.strip()

    print("VERIFY MOBILE:", mobile)
    print("OTP STORE:", otp_store)

    record = otp_store.get(mobile)

    if not record:
        raise HTTPException(400, "OTP not found")

    if record["otp"] != otp:
        raise HTTPException(400, "Invalid OTP")

    if datetime.utcnow() > record["expires"]:
        raise HTTPException(400, "OTP expired")

    return {"message": "Mobile verified"}


# --- Profile ---
# ================= Get Profile =================
@app.get("/api/profile", response_model=ProfileResponse)
def get_profile(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    profile = db.query(UserProfile).filter(UserProfile.user_id == current_user.user_id).first()
    if not profile:
        # Create default profile if missing
        profile = UserProfile(user_id=current_user.user_id, email=current_user.email)
        db.add(profile)
        db.commit()
        db.refresh(profile)

    return ProfileResponse(
        name=profile.name,
        registerNo=profile.register_no,
        email=profile.email,
        mobile=profile.mobile,
        dob=profile.dob,
        gender=profile.gender,
        bio=profile.bio,
        skills=profile.skills,
        degree=profile.degree,
        department=profile.department,
        year=profile.year,
        batch=profile.batch,
        github=profile.github,
        linkedin=profile.linkedin,
        whatsapp=profile.whatsapp,
        image=profile.image_url,
        resume=profile.resume_url,
    )

# ================= Get Project Stats =================
@app.get("/api/profile/stats", response_model=ProjectStats)
def get_project_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    my_projects = db.query(Project).filter(Project.created_by == current_user.user_id).all()
    my_projects_count = len(my_projects)
    my_completed = sum(1 for p in my_projects if p.status == "completed")

    member_projects = db.query(ProjectMember).filter(
        ProjectMember.user_id == current_user.user_id,
        ProjectMember.role == "member"
    ).all()
    member_projects_count = len(member_projects)
    member_completed = sum(1 for pm in member_projects if pm.project.status == "completed")

    return ProjectStats(
        myProjects=my_projects_count,
        myCompleted=my_completed,
        memberProjects=member_projects_count,
        memberCompleted=member_completed
    )

# ================= Get Profile by ID =================
@app.get("/api/profile/{user_id}")
def get_profile_by_id(
    user_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    profile = db.query(UserProfile).filter(
        UserProfile.user_id == user_id
    ).first()

    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    return {
        "name": profile.name,
        "registerNo": profile.register_no,
        "email": profile.email,
        "mobile": profile.mobile,
        "dob": profile.dob,
        "gender": profile.gender,
        "bio": profile.bio,
        "skills": profile.skills,
        "degree": profile.degree,
        "department": profile.department,
        "year": profile.year,
        "batch": profile.batch,
        "github": profile.github,
        "linkedin": profile.linkedin,
        "whatsapp": profile.whatsapp,
        "image": profile.image_url,
        "resume": profile.resume_url,
    }

# ================= Get Project Stats by ID =================
@app.get("/api/profile/{user_id}/stats")
def get_user_project_stats(
    user_id: str,
    db: Session = Depends(get_db)
):
    # OWNED PROJECTS
    my_projects = db.query(Project).filter(
        Project.created_by == user_id
    ).all()

    my_projects_count = len(my_projects)
    my_completed = sum(1 for p in my_projects if p.status == "completed")

    # MEMBER PROJECTS
    member_projects = db.query(ProjectMember).filter(
        ProjectMember.user_id == user_id,
        ProjectMember.role == "member"
    ).all()

    member_projects_count = len(member_projects)
    member_completed = sum(
        1 for pm in member_projects if pm.project.status == "completed"
    )

    return {
        "myProjects": my_projects_count,
        "myCompleted": my_completed,
        "memberProjects": member_projects_count,
        "memberCompleted": member_completed
    }

# ================= Update Profile =================
@app.put("/api/profile")
async def update_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    name: Optional[str] = Form(None),
    registerNo: Optional[str] = Form(None),
    email: Optional[str] = Form(None),
    mobile: Optional[str] = Form(None),
    dob: Optional[str] = Form(None),
    gender: Optional[str] = Form(None),
    bio: Optional[str] = Form(None),
    skills: Optional[str] = Form(None),
    degree: Optional[str] = Form(None),
    department: Optional[str] = Form(None),
    year: Optional[str] = Form(None),
    batch: Optional[str] = Form(None),
    github: Optional[str] = Form(None),
    linkedin: Optional[str] = Form(None),
    whatsapp: Optional[str] = Form(None),
    image: Optional[UploadFile] = File(None),
    resume: Optional[UploadFile] = File(None),
):
    profile = db.query(UserProfile).filter(UserProfile.user_id == current_user.user_id).first()

    # 🔥 CREATE PROFILE IF NOT EXISTS
    if not profile:
        profile = UserProfile(user_id=current_user.user_id)
        db.add(profile)
        db.commit()
        db.refresh(profile)

    # ================= TEXT =================
    if name is not None: profile.name = name
    if registerNo is not None: profile.register_no = registerNo
    if email is not None: profile.email = email
    if mobile is not None: profile.mobile = mobile
    if dob is not None: profile.dob = dob
    if gender is not None: profile.gender = gender
    if bio is not None: profile.bio = bio
    if skills is not None: profile.skills = skills
    if degree is not None: profile.degree = degree
    if department is not None: profile.department = department
    if year is not None: profile.year = year
    if batch is not None: profile.batch = batch
    if github is not None: profile.github = github
    if linkedin is not None: profile.linkedin = linkedin
    if whatsapp is not None: profile.whatsapp = whatsapp

    # ================= IMAGE =================
    if image:
        # delete old file
        if profile.image_url:
            old_path = Path(profile.image_url.lstrip("/"))
            if old_path.exists() and old_path.is_file():
                try:
                    old_path.unlink()
                except Exception as e:
                    print("Error deleting image:", e)

        # save new
        profile.image_url = await save_upload_file(image, "images")

    # ================= RESUME =================
    if resume:
        if profile.resume_url:
            old_path = Path(profile.resume_url.lstrip("/"))
            if old_path.exists() and old_path.is_file():
                try:
                    old_path.unlink()
                except Exception as e:
                    print("Error deleting resume:", e)

        profile.resume_url = await save_upload_file(resume, "resumes")

    # ================= SAVE =================
    db.commit()
    db.refresh(profile)

    return {"message": "Profile updated successfully"}

# ================= Change Password =================
@app.put("/api/profile/change-password")
def change_password(
    data: PasswordChange,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not verify_password(data.currentPassword, current_user.password):
        raise HTTPException(400, "Wrong current password")
    current_user.password = hash_password(data.newPassword)
    db.commit()
    return {"message": "Password updated successfully"}

# --- Dashboard Stats (Home) ---
@app.get("/api/dashboard/stats", response_model=DashboardStats)
def get_dashboard_stats(db: Session = Depends(get_db)):
    total_projects = db.query(Project).count()
    total_mentors = db.query(User).filter(User.role == "mentor").count()
    total_students = db.query(User).filter(User.role == "student").count()
    return DashboardStats(
        projects=total_projects,
        mentors=total_mentors,
        students=total_students
    )
# --- Projects APIs student ---

# ================= CREATE PROJECT =================
@app.post("/api/projects")
def create_project(
    data: CreateProjectRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # ================= VALIDATION =================

    if not data.title or not data.title.strip():
        raise HTTPException(400, "Project title is required")

    if not data.description or not data.description.strip():
        raise HTTPException(400, "Project description is required")

    if data.required_members is None or data.required_members <= 0:
        raise HTTPException(400, "Required members must be greater than 0")

    # ================= DEPARTMENT VALIDATION =================
    departments = data.departments or []

    # remove duplicates
    departments = list(set(departments))

    # convert ALL → empty
    if "ALL" in departments:
        departments = []

    # validate codes
    invalid = [d for d in departments if d not in ALLOWED_DEPARTMENTS]

    if invalid:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid departments: {invalid}"
        )

    # ================= CREATE PROJECT =================
    project = Project(
        title=data.title.strip(),
        description=data.description.strip(),
        departments=departments,
        required_members=data.required_members,
        expected_completion=data.expected_completion,
        created_by=current_user.user_id,
        status="active"
    )

    db.add(project)
    db.commit()
    db.refresh(project)

    # ================= ADD OWNER =================
    owner_member = ProjectMember(
        project_id=project.id,
        user_id=current_user.user_id,
        role="owner"
    )

    db.add(owner_member)
    db.commit()

    return {
        "message": "Project created successfully",
        "project_id": project.id
    }


# ================= UPDATE PROJECT =================
@app.put("/api/projects/{project_id}")
def update_project(
    project_id: int,
    data: CreateProjectRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    project = db.query(Project).filter(Project.id == project_id).first()

    if not project:
        raise HTTPException(404, "Project not found")

    if project.created_by != current_user.user_id:
        raise HTTPException(403, "Not authorized")

    # ================= VALIDATION =================

    if not data.title or not data.title.strip():
        raise HTTPException(400, "Project title is required")

    if not data.description or not data.description.strip():
        raise HTTPException(400, "Project description is required")

    if data.required_members is None or data.required_members <= 0:
        raise HTTPException(400, "Required members must be greater than 0")

    # ================= MEMBER SAFETY =================
    members_count = db.query(ProjectMember).filter(
        ProjectMember.project_id == project_id
    ).count()

    if data.required_members < members_count:
        raise HTTPException(
            400,
            "Cannot reduce below current members"
        )

    # ================= DEPARTMENT VALIDATION =================
    departments = data.departments or []

    departments = list(set(departments))

    if "ALL" in departments:
        departments = []

    invalid = [d for d in departments if d not in ALLOWED_DEPARTMENTS]

    if invalid:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid departments: {invalid}"
        )

    # ================= UPDATE =================
    project.title = data.title.strip()
    project.description = data.description.strip()
    project.departments = departments
    project.required_members = data.required_members
    project.expected_completion = data.expected_completion

    db.commit()
    db.refresh(project)

    return {"message": "Project updated successfully"}

#================== SEARCH & FILTER PROJECTS =================
@app.get("/api/projects/search")
def search_projects(
    q: str = "",
    department: str = "",
    status: str = "open",
    page: int = 1,
    limit: int = 10,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        query = db.query(Project)

        # ================= SEARCH =================
        if q:
            query = query.filter(Project.title.ilike(f"%{q}%"))

        # ================= STATUS FILTER =================
        if status == "open":
            query = query.filter(Project.status == "active")

        elif status == "closed":
            query = query.filter(Project.status == "closed")

        elif status == "completed":
            query = query.filter(Project.status == "completed")

        elif status == "all":
            query = query.filter(Project.status.in_(["active", "closed"]))

        # ================= DEPARTMENT FILTER =================
        if department:
            query = query.filter(
                (func.JSON_LENGTH(Project.departments) == 0) |
                Project.dept_text.like(f"%{department}%")
            )

        # ================= FETCH =================
        projects = (
            query
            .order_by(Project.id.desc())
            .offset((page - 1) * limit)
            .limit(limit)
            .all()
        )

        result = []

        for p in projects:

            # OWNER PROFILE
            profile = db.query(UserProfile).filter(
                UserProfile.user_id == p.created_by
            ).first()

            # JOIN REQUEST
            join_req = db.query(JoinRequest).filter_by(
                project_id=p.id,
                user_id=current_user.user_id
            ).first()

            join_status = join_req.status if join_req else None
            reason = join_req.reason if join_req else None

            result.append({
                "id": p.id,
                "title": p.title,
                "description": p.description,
                "departments": p.departments or [],
                "required_members": p.required_members,
                "members_count": len(p.members),
                "expected_completion": p.expected_completion,
                "status": p.status,

                "owner": {
                    "name": profile.name if profile else p.created_by,
                    "department": profile.department if profile else None,
                    "reg_no": profile.register_no if profile else None,
                    "image": profile.image_url if profile else None
                },

                "join_status": join_status,
                "reason": reason,

                "is_owner": p.created_by == current_user.user_id
            })

        return {
            "data": result,
            "page": page,
            "limit": limit
        }

    except Exception as e:
        print("SEARCH ERROR:", str(e))
        raise HTTPException(status_code=500, detail=str(e))
    
#================== GET MEMBER PROJECTS =================
@app.get("/api/projects/member")
def get_member_projects(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    memberships = db.query(ProjectMember).filter(
        ProjectMember.user_id == current_user.user_id,
        ProjectMember.role == "member"
    ).all()

    result = []

    for m in memberships:

        p = m.project

        profile = db.query(UserProfile).filter(
            UserProfile.user_id == p.created_by
        ).first()

        result.append({
            "id": p.id,
            "title": p.title,
            "description": p.description,
            "departments": p.departments or [],
            "required_members": p.required_members,
            "members_count": len(p.members),
            "expected_completion": p.expected_completion,
            "status": p.status,

            "owner": {
                "name": profile.name if profile else p.created_by,
                "department": profile.department if profile else None,
                "reg_no": profile.register_no if profile else None,
                "image": profile.image_url if profile else None
            }
        })

    return {"data": result}

#---Join / Leave APIs---  
#========================= Join Project  =================
@app.post("/api/projects/{project_id}/join")
def join_project(
    project_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # =========================
    # 1. CHECK PROJECT EXISTS
    # =========================
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # =========================
    # 2. PREVENT OWNER JOIN
    # =========================
    if project.created_by == current_user.user_id:
        raise HTTPException(status_code=400, detail="You cannot join your own project")

    # =========================
    # 3. CHECK PROJECT STATUS
    # =========================
    if project.status != "active":
        raise HTTPException(status_code=400, detail="Project is not open for joining")
    
    # =========================
    # 🔥 3.5 DEPARTMENT VALIDATION
    # =========================
    profile = db.query(UserProfile).filter(
        UserProfile.user_id == current_user.user_id
    ).first()

    user_dept = profile.department if profile else None

    # ✅ NEW FIX
    if not user_dept:
        raise HTTPException(
            status_code=400,
            detail="Please complete your profile (department missing)"
        )

    project_departments = project.departments or []

    if project_departments and user_dept not in project_departments:
        raise HTTPException(
            status_code=403,
            detail="You are not eligible to apply for this project (department mismatch)"
        )

    # =========================
    # 4. CHECK MEMBER COUNT (FIXED)
    # =========================
    current_members = db.query(ProjectMember).filter(
        ProjectMember.project_id == project_id
    ).count()

    if current_members >= project.required_members:
        raise HTTPException(status_code=400, detail="Project is already full")

    # =========================
    # 5. CHECK EXISTING REQUEST
    # =========================
    existing = db.query(JoinRequest).filter_by(
        project_id=project_id,
        user_id=current_user.user_id
    ).first()

    if existing:
        if existing.status == "pending":
            raise HTTPException(status_code=400, detail="Request already pending")

        elif existing.status == "accepted":
            raise HTTPException(status_code=400, detail="Already a member")

        elif existing.status in ["rejected", "cancelled"]:
            # allow re-apply
            existing.status = "pending"
            existing.reason = None
            db.commit()
            return {"message": "Request sent again"}

    # =========================
    # 6. CREATE NEW REQUEST
    # =========================
    new_request = JoinRequest(
        project_id=project_id,
        user_id=current_user.user_id,
        status="pending"
    )

    db.add(new_request)
    db.commit()

    return {"message": "Request sent successfully"}

#========================= Cancel Join Request =================
@app.post("/api/projects/{project_id}/cancel")
def cancel_request(
    project_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # =========================
    # 1. CHECK PROJECT EXISTS
    # =========================
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # =========================
    # 2. FIND REQUEST
    # =========================
    req = db.query(JoinRequest).filter_by(
        project_id=project_id,
        user_id=current_user.user_id
    ).first()

    if not req:
        raise HTTPException(status_code=404, detail="Request not found")

    # =========================
    # 3. VALIDATE STATUS
    # =========================
    if req.status == "cancelled":
        raise HTTPException(status_code=400, detail="Already cancelled")

    if req.status == "accepted":
        raise HTTPException(status_code=400, detail="Cannot cancel after acceptance")

    if req.status == "rejected":
        raise HTTPException(status_code=400, detail="Cannot cancel rejected request")

    # =========================
    # 4. CANCEL REQUEST
    # =========================
    req.status = "cancelled"
    db.commit()

    return {"message": "Request cancelled successfully"}

#========================= Leave Project =================
@app.post("/api/projects/{project_id}/leave")
def leave_project(
    project_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # check project
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(404, "Project not found")

    # cannot leave if owner
    if project.created_by == current_user.user_id:
        raise HTTPException(400, "Owner cannot leave project")

    # find membership
    member = db.query(ProjectMember).filter_by(
        project_id=project_id,
        user_id=current_user.user_id
    ).first()

    if not member:
        raise HTTPException(404, "You are not a member")

    # delete member
    db.delete(member)

    # update join request (optional sync)
    req = db.query(JoinRequest).filter_by(
        project_id=project_id,
        user_id=current_user.user_id
    ).first()

    if req:
        req.status = "cancelled"

    db.commit()

    return {"message": "Left project successfully"}

#---Project Requests---
#========================= Get Join Requests =================
@app.get("/api/projects/{project_id}/requests")
def get_requests(
    project_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(404, "Project not found")

    if project.created_by != current_user.user_id:
        raise HTTPException(403, "Not authorized")

    requests = (
        db.query(JoinRequest)
        .join(User, User.user_id == JoinRequest.user_id)
        .filter(
            JoinRequest.project_id == project_id,
            JoinRequest.status == "pending",
            User.role == "student"
        )
        .all()
    )

    result = []

    for r in requests:
        profile = db.query(UserProfile).filter(
            UserProfile.user_id == r.user_id
        ).first()

        result.append({
            "user_id": r.user_id,
            "name": profile.name if profile else r.user_id,
            "department": profile.department if profile else None,
            "reg_no": profile.register_no if profile else None,
            "image": profile.image_url if profile else None
        })

    return {"data": result}

#========================= Accept Join Request =================
@app.post("/api/projects/{project_id}/accept/{user_id}")
def accept_request(
    project_id: int,
    user_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(404, "Project not found")

    if project.created_by != current_user.user_id:
        raise HTTPException(403, "Not authorized")

    # check full
    current_members = db.query(ProjectMember).filter(
        ProjectMember.project_id == project_id
    ).count()

    if current_members >= project.required_members:
        raise HTTPException(400, "Project is full")

    req = db.query(JoinRequest).filter_by(
        project_id=project_id,
        user_id=user_id
    ).first()

    if not req or req.status != "pending":
        raise HTTPException(400, "Invalid request")

    # accept request
    req.status = "accepted"

    # add to members
    member = ProjectMember(
        project_id=project_id,
        user_id=user_id,
        role="member"
    )

    db.add(member)
    db.commit()

    return {"message": "User accepted"}

#========================= Reject Join Request =================
@app.post("/api/projects/{project_id}/reject/{user_id}")
def reject_request(
    project_id: int,
    user_id: str,
    reason: str = "Not suitable",
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(404, "Project not found")

    if project.created_by != current_user.user_id:
        raise HTTPException(403, "Not authorized")

    req = db.query(JoinRequest).filter_by(
        project_id=project_id,
        user_id=user_id
    ).first()

    if not req or req.status != "pending":
        raise HTTPException(400, "Invalid request")

    req.status = "rejected"
    req.reason = reason

    db.commit()

    return {"message": "User rejected"}

#---Project Members---
#========================= Get Project Members =================
@app.get("/api/projects/{project_id}/members")
def get_members(
    project_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    members = db.query(ProjectMember).filter(
        ProjectMember.project_id == project_id
    ).all()

    result = []

    for m in members:
        profile = db.query(UserProfile).filter(
            UserProfile.user_id == m.user_id
        ).first()

        result.append({
            "user_id": m.user_id,
            "name": profile.name if profile else None,
            "department": profile.department if profile else None,
            "reg_no": profile.register_no if profile else None,
            "image": profile.image_url if profile else None,
            "role": m.role
        })

    return {"data": result}

#========================= Remove Member (Owner Only) =================
@app.post("/api/projects/{project_id}/remove/{user_id}")
def remove_member(
    project_id: int,
    user_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # =========================
    # 1. CHECK PROJECT
    # =========================
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(404, "Project not found")

    # =========================
    # 2. AUTH CHECK
    # =========================
    if project.created_by != current_user.user_id:
        raise HTTPException(403, "Not authorized")

    # =========================
    # 3. FIND MEMBER
    # =========================
    member = db.query(ProjectMember).filter_by(
        project_id=project_id,
        user_id=user_id
    ).first()

    if not member:
        raise HTTPException(404, "Member not found")

    # =========================
    # 4. PREVENT OWNER REMOVE
    # =========================
    if member.role == "owner":
        raise HTTPException(400, "Cannot remove owner")

    # =========================
    # 5. DELETE MEMBER
    # =========================
    db.delete(member)

    # =========================
    # 6. SYNC JOIN REQUEST (CRITICAL FIX)
    # =========================
    req = db.query(JoinRequest).filter_by(
        project_id=project_id,
        user_id=user_id
    ).first()

    if req:
        req.status = "cancelled"
        req.reason = "Removed by owner"   # ✅ optional but useful

    # =========================
    # 7. COMMIT
    # =========================
    db.commit()

    return {
        "message": "Member removed successfully"
    }

#---Project Details---
#========================= Get Project Details =================
@app.get("/api/projects/{project_id}")
def get_project(
    project_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # =========================
    # 1. GET PROJECT
    # =========================
    project = db.query(Project).filter(Project.id == project_id).first()

    if not project:
        raise HTTPException(404, "Project not found")

    # =========================
    # 2. OWNER PROFILE
    # =========================
    owner = db.query(UserProfile).filter(
        UserProfile.user_id == project.created_by
    ).first()

    # =========================
    # 3. MEMBERS COUNT
    # =========================
    members_count = db.query(ProjectMember).filter(
        ProjectMember.project_id == project_id
    ).count()

    # =========================
    # 4. RESPONSE (FINAL)
    # =========================
    return {
        "id": project.id,
        "title": project.title,
        "description": project.description,
        "status": project.status,

        # 🔥 CORE FIELDS (FRONTEND NEEDS)
        "departments": project.departments or [],
        "expected_completion": project.expected_completion or "",

        # 🔥 MEMBERS
        "required_members": project.required_members,
        "members_count": members_count,

        # 🔥 ROLE
        "is_owner": project.created_by == current_user.user_id,

        # 🔥 OWNER INFO
        "owner": {
            "name": owner.name if owner else project.created_by,
            "department": owner.department if owner else None
        }
    }

#========================= Update Project Status (owner only) =================
@app.put("/api/projects/{project_id}/status")
def update_status(
    project_id: int,
    status: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    project = db.query(Project).filter(Project.id == project_id).first()

    if not project:
        raise HTTPException(404, "Project not found")

    if project.created_by != current_user.user_id:
        raise HTTPException(403, "Not authorized")

    project.status = status
    db.commit()

    return {"message": "Status updated"}

#========================= Delete Project (owner only) =================
@app.delete("/api/projects/{project_id}")
def delete_project(
    project_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    project = db.query(Project).filter(Project.id == project_id).first()

    if not project:
        raise HTTPException(404, "Project not found")

    if project.created_by != current_user.user_id:
        raise HTTPException(403, "Not authorized")

    db.delete(project)
    db.commit()

    return {"message": "Project deleted"}

#========================= Request Project Completion (owner only) =================
@app.post("/api/projects/{project_id}/complete-request")
def request_project_completion(
    project_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    project = db.query(Project).filter(Project.id == project_id).first()

    if not project:
        raise HTTPException(404, "Project not found")

    if project.created_by != current_user.user_id:
        raise HTTPException(403, "Only project owner can request completion")

    if project.status != "active":
        raise HTTPException(400, "Project must be active")

    existing = db.query(ProjectCompletionRequest).filter(
        ProjectCompletionRequest.project_id == project_id
    ).first()

    if existing and existing.status == "pending":
        raise HTTPException(400, "Completion request already pending")

    req = ProjectCompletionRequest(
        project_id=project_id,
        owner_id=current_user.user_id
    )

    db.add(req)
    db.commit()

    return {"message": "Completion request sent to admin"}


@app.get("/api/projects/{project_id}/completion-status")
def get_completion_status(
    project_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    req = db.query(ProjectCompletionRequest).filter(
        ProjectCompletionRequest.project_id == project_id
    ).order_by(ProjectCompletionRequest.id.desc()).first()

    if not req:
        return {"status": None}

    return {"status": req.status}

@app.get("/api/projects/{project_id}/messages")
def get_messages(
    project_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    project = db.query(Project).filter(
        Project.id == project_id
    ).first()

    if not project:
        raise HTTPException(404, "Project not found")

    # ROLE FILTER
    if current_user.role == "student":
        allowed_roles = ["student", "mentor"]

    elif current_user.role == "mentor":
        allowed_roles = ["student", "mentor", "admin"]

    else:
        allowed_roles = ["mentor", "admin"]

    rows = db.query(TaskMessage).filter(
        TaskMessage.project_id == project_id,
        TaskMessage.sender_role.in_(allowed_roles)
    ).order_by(TaskMessage.created_at.asc()).all()

    result = []

    for r in rows:
        result.append({
            "id": r.id,
            "sender": r.sender_id,
            "role": r.sender_role,
            "message": r.message,
            "time": r.created_at
        })

    return {"data": result}

@app.post("/api/projects/{project_id}/messages")
def send_message(
    project_id: int,
    data: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    project = db.query(Project).filter(
        Project.id == project_id
    ).first()

    if not project:
        raise HTTPException(404, "Project not found")

    msg = TaskMessage(
        project_id=project_id,
        sender_id=current_user.user_id,
        sender_role=current_user.role,
        message=data.get("message")
    )

    db.add(msg)
    db.commit()

    return {"message": "Message sent"}
#=========================Mentor APIs=================
# ==============================
# GET ALL MENTORS student side (for join requests)
# ==============================
@app.get("/api/mentors")
def get_all_mentors(
    project_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    mentors = (
        db.query(
            User.user_id,
            UserProfile.name,
            UserProfile.department,
            UserProfile.image_url,
            User.email
        )
        .join(UserProfile, UserProfile.user_id == User.user_id)
        .filter(User.role == "mentor")
        .all()
    )

    result = []

    for m in mentors:

        # 1️⃣ Check if mentor is currently assigned to project
        assigned = db.query(ProjectMentor).filter(
            ProjectMentor.project_id == project_id,
            ProjectMentor.mentor_id == m.user_id
        ).first()

        # 2️⃣ Get latest mentor request
        req = (
            db.query(MentorRequest)
            .filter(
                MentorRequest.project_id == project_id,
                MentorRequest.mentor_id == m.user_id
            )
            .order_by(MentorRequest.id.desc())
            .first()
        )

        status = None

        # 🔥 Accepted must ONLY come from project_mentors table
        if assigned:
            status = "accepted"

        elif req:
            if req.status == "pending":
                status = "pending"
            elif req.status == "rejected":
                status = "rejected"

        result.append({
            "user_id": m.user_id,
            "name": m.name,
            "department": m.department,
            "image": m.image_url,
            "email": m.email,
            "request_status": status
        })

    return {"data": result}

@app.get("/api/mentor/profile")
def get_mentor_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    profile = db.query(UserProfile).filter(
        UserProfile.user_id == current_user.user_id
    ).first()

    if not profile:
        return {}

    return {
        "name": profile.name,
        "staffId": profile.register_no,
        "email": profile.email,
        "mobile": profile.mobile,
        "dob": profile.dob,
        "gender": profile.gender,
        "bio": profile.bio,
        "skills": profile.skills,
        "department": profile.department,
        "designation": profile.degree,
        "qualification": profile.year,
        "experience": profile.batch,
        "github": profile.github,
        "linkedin": profile.linkedin,
        "whatsapp": profile.whatsapp,
        "image": profile.image_url,
        "resume": profile.resume_url
    }

@app.get("/api/mentor/profile/stats")
def get_mentor_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    mentoring_projects = db.query(Project).filter(
        Project.created_by == current_user.user_id
    ).count()

    completed_projects = db.query(Project).filter(
        Project.created_by == current_user.user_id,
        Project.status == "completed"
    ).count()

    active_students = db.query(ProjectMember).join(Project).filter(
        Project.created_by == current_user.user_id
    ).count()

    return {
        "mentoringProjects": mentoring_projects,
        "completedProjects": completed_projects,
        "activeStudents": active_students
    }

@app.put("/api/mentor/profile")
async def update_mentor_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    name: Optional[str] = Form(None),
    staffId: Optional[str] = Form(None),
    email: Optional[str] = Form(None),
    mobile: Optional[str] = Form(None),
    dob: Optional[str] = Form(None),
    gender: Optional[str] = Form(None),
    bio: Optional[str] = Form(None),
    skills: Optional[str] = Form(None),
    department: Optional[str] = Form(None),
    designation: Optional[str] = Form(None),
    qualification: Optional[str] = Form(None),
    experience: Optional[str] = Form(None),
    github: Optional[str] = Form(None),
    linkedin: Optional[str] = Form(None),
    whatsapp: Optional[str] = Form(None),
    image: Optional[UploadFile] = File(None),
    resume: Optional[UploadFile] = File(None),
):

    profile = db.query(UserProfile).filter(
        UserProfile.user_id == current_user.user_id
    ).first()

    if not profile:
        profile = UserProfile(user_id=current_user.user_id)
        db.add(profile)
        db.commit()
        db.refresh(profile)

    # TEXT FIELDS
    if name is not None:
        profile.name = name

    if staffId is not None:
        profile.register_no = staffId

    if email is not None:
        profile.email = email

    if mobile is not None:
        profile.mobile = mobile

    if dob is not None:
        profile.dob = dob

    if gender is not None:
        profile.gender = gender

    if bio is not None:
        profile.bio = bio

    if skills is not None:
        profile.skills = skills

    if department is not None:
        profile.department = department

    if designation is not None:
        profile.degree = designation

    if qualification is not None:
        profile.year = qualification

    if experience is not None:
        profile.batch = experience

    if github is not None:
        profile.github = github

    if linkedin is not None:
        profile.linkedin = linkedin

    if whatsapp is not None:
        profile.whatsapp = whatsapp

    # IMAGE UPLOAD
    if image:
        if profile.image_url:
            old_path = Path(profile.image_url.lstrip("/"))
            if old_path.exists():
                old_path.unlink()

        profile.image_url = await save_upload_file(image, "images")

    # RESUME UPLOAD
    if resume:
        if profile.resume_url:
            old_path = Path(profile.resume_url.lstrip("/"))
            if old_path.exists():
                old_path.unlink()

        profile.resume_url = await save_upload_file(resume, "resumes")

    db.commit()
    db.refresh(profile)

    return {"message": "Mentor profile updated successfully"}

@app.put("/api/mentor/profile/change-password")
def change_password(
    data: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    user = db.query(User).filter(User.user_id == current_user.user_id).first()

    if not verify_password(data["currentPassword"], user.password):
        raise HTTPException(status_code=400, detail="Incorrect current password")

    user.password = hash_password(data["newPassword"])

    db.commit()

    return {"message": "Password updated"}

@app.get("/api/mentor/requests")
def get_mentor_requests(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    rows = (
        db.query(
            MentorRequest.id,
            MentorRequest.project_id,
            Project.title.label("project_title"),
            MentorRequest.owner_id,
            UserProfile.name.label("student_name"),
            UserProfile.image_url.label("student_image")
        )
        .join(Project, Project.id == MentorRequest.project_id)
        .join(UserProfile, UserProfile.user_id == MentorRequest.owner_id)
        .filter(
            MentorRequest.mentor_id == current_user.user_id,
            MentorRequest.status == "pending"
        )
        .all()
    )

    result = []

    for r in rows:
        result.append({
            "id": r.id,
            "project_id": r.project_id,
            "project_title": r.project_title,
            "student_id": r.owner_id,
            "student_name": r.student_name,
            "student_image": r.student_image
        })

    return {"data": result}
# ==============================
# REQUEST MENTOR
# ==============================

@app.post("/api/mentor/request")
def request_mentor(
    data: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    project_id = data.get("project_id")
    mentor_id = data.get("mentor_id")

    if not project_id or not mentor_id:
        raise HTTPException(400, "Invalid request")

    project = db.query(Project).filter(Project.id == project_id).first()

    if not project:
        raise HTTPException(404, "Project not found")

    if project.created_by != current_user.user_id:
        raise HTTPException(403, "Only project owner can request mentor")

    existing = db.query(MentorRequest).filter(
        MentorRequest.project_id == project_id,
        MentorRequest.mentor_id == mentor_id
    ).first()

    if existing:

        if existing.status == "pending":
            raise HTTPException(400, "Mentor request already pending")

        if existing.status == "accepted":
            raise HTTPException(400, "Mentor already assigned")

        if existing.status == "rejected":
            existing.status = "pending"
            db.commit()
            return {"message": "Mentor request sent again"}

    req = MentorRequest(
        project_id=project_id,
        owner_id=current_user.user_id,
        mentor_id=mentor_id,
        status="pending"
    )

    db.add(req)
    db.commit()

    return {"message": "Mentor request sent"}

# ================= CANCEL MENTOR REQUEST =================
@app.delete("/api/mentor/request/{project_id}/{mentor_id}")
def cancel_mentor_request(
    project_id: int,
    mentor_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    req = db.query(MentorRequest).filter(
        MentorRequest.project_id == project_id,
        MentorRequest.mentor_id == mentor_id,
        MentorRequest.owner_id == current_user.user_id
    ).first()

    if not req:
        raise HTTPException(status_code=404, detail="Request not found")

    if req.status != "pending":
        raise HTTPException(
            status_code=400,
            detail="Only pending requests can be cancelled"
        )

    db.delete(req)
    db.commit()

    return {"message": "Mentor request cancelled"}

@app.delete("/api/project/mentor/{project_id}/{mentor_id}")
def remove_project_mentor(
    project_id: int,
    mentor_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    project = db.query(Project).filter(
        Project.id == project_id
    ).first()

    if not project:
        raise HTTPException(404, "Project not found")

    # only project owner can remove mentor
    if project.created_by != current_user.user_id:
        raise HTTPException(403, "Not allowed")

    mentor = db.query(ProjectMentor).filter(
        ProjectMentor.project_id == project_id,
        ProjectMentor.mentor_id == mentor_id
    ).first()

    if not mentor:
        raise HTTPException(404, "Mentor not assigned")

    # remove mentor assignment
    db.delete(mentor)

    # 🔧 reset mentor request status
    req = db.query(MentorRequest).filter(
        MentorRequest.project_id == project_id,
        MentorRequest.mentor_id == mentor_id
    ).order_by(MentorRequest.id.desc()).first()

    if req:
        req.status = "rejected"

    db.commit()

    return {"message": "Mentor removed"}

@app.put("/api/mentor/requests/{request_id}/accept")
def accept_mentor_request(
    request_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    req = db.query(MentorRequest).filter(
        MentorRequest.id == request_id
    ).first()

    if not req:
        raise HTTPException(404, "Request not found")

    if req.status != "pending":
        raise HTTPException(400, "Request already processed")

    # update request
    req.status = "accepted"

    # ensure mentor added
    existing = db.query(ProjectMentor).filter(
        ProjectMentor.project_id == req.project_id,
        ProjectMentor.mentor_id == req.mentor_id
    ).first()

    if not existing:
        mentor = ProjectMentor(
            project_id=req.project_id,
            mentor_id=req.mentor_id
        )
        db.add(mentor)

    db.commit()

    return {"message": "Mentor assigned successfully"}

@app.put("/api/mentor/requests/{request_id}/reject")
def reject_mentor_request(
    request_id: int,
    db: Session = Depends(get_db)
):

    req = db.query(MentorRequest).filter(
        MentorRequest.id == request_id
    ).first()

    if not req:
        raise HTTPException(404, "Request not found")

    req.status = "rejected"
    db.commit()

    return {"message": "Request rejected"}

@app.get("/api/mentor/projects")
def get_mentor_projects(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    rows = (
        db.query(Project)
        .join(ProjectMentor, ProjectMentor.project_id == Project.id)
        .filter(ProjectMentor.mentor_id == current_user.user_id)
        .all()
    )

    result = []

    for p in rows:

        profile = db.query(UserProfile).filter(
            UserProfile.user_id == p.created_by
        ).first()

        result.append({
            "id": p.id,
            "title": p.title,
            "description": p.description,
            "departments": p.departments or [],
            "required_members": p.required_members,
            "members_count": len(p.members),
            "expected_completion": p.expected_completion,
            "status": p.status,

            "owner": {
                "name": profile.name if profile else p.created_by,
                "department": profile.department if profile else None,
                "image": profile.image_url if profile else None
            }
        })

    return {"data": result}


#=========================Admin APIs=================
# ================= ADMIN GET PROJECTS =================
# ================= ADMIN PROJECTS =================
@app.get("/api/admin/projects")
def get_admin_projects(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    # optional: ensure admin role
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin only")

    projects = db.query(Project).all()

    result = []

    for p in projects:

        profile = db.query(UserProfile).filter(
            UserProfile.user_id == p.created_by
        ).first()

        result.append({
            "id": p.id,
            "title": p.title,
            "description": p.description,
            "status": p.status,
            "required_members": p.required_members,
            "members_count": len(p.members),

            "owner": {
                "name": profile.name if profile else p.created_by,
                "department": profile.department if profile else None,
                "image": profile.image_url if profile else None
            }
        })

    return {"data": result}

# ================= ADMIN DASHBOARD STATS =================
@app.get("/api/admin/dashboard/stats")
def get_admin_dashboard_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin only")

    total_projects = db.query(Project).count()

    completed_projects = db.query(Project).filter(
        Project.status == "completed"
    ).count()

    working_projects = db.query(Project).filter(
        Project.status == "active"
    ).count()

    return {
        "totalProjects": total_projects,
        "completedProjects": completed_projects,
        "workingProjects": working_projects
    }

# ================= ADMIN PROJECT DETAILS =================
@app.get("/api/admin/projects/{project_id}")
def get_admin_project_details(
    project_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    # optional security
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin only")

    project = db.query(Project).filter(Project.id == project_id).first()

    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # ===== OWNER PROFILE =====
    profile = db.query(UserProfile).filter(
        UserProfile.user_id == project.created_by
    ).first()

    # ===== MEMBERS =====
    members = []

    rows = db.query(ProjectMember).filter(
        ProjectMember.project_id == project_id
    ).all()

    for m in rows:

        p = db.query(UserProfile).filter(
            UserProfile.user_id == m.user_id
        ).first()

        members.append({
            "user_id": m.user_id,
            "name": p.name if p else m.user_id,
            "department": p.department if p else None,
            "image": p.image_url if p else None,
            "role": m.role
        })

    # ===== MENTOR =====
    mentor_row = db.query(ProjectMentor).filter(
        ProjectMentor.project_id == project_id
    ).first()

    mentor = None

    if mentor_row:
        mp = db.query(UserProfile).filter(
            UserProfile.user_id == mentor_row.mentor_id
        ).first()

        mentor = {
            "user_id": mentor_row.mentor_id,
            "name": mp.name if mp else mentor_row.mentor_id,
            "department": mp.department if mp else None,
            "image": mp.image_url if mp else None
        }

    return {
        "project": {
            "id": project.id,
            "title": project.title,
            "description": project.description,
            "status": project.status
        },
        "members": members,
        "mentor": mentor
    }



@app.get("/api/admin/completion-requests")
def get_completion_requests(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    if current_user.role != "admin":
        raise HTTPException(403, "Admin only")

    rows = db.query(ProjectCompletionRequest).filter(
        ProjectCompletionRequest.status == "pending"
    ).all()

    result = []

    for r in rows:
        project = db.query(Project).filter(
            Project.id == r.project_id
        ).first()

        result.append({
            "id": r.id,
            "project_id": r.project_id,
            "title": project.title if project else None,
            "status": r.status
        })

    return {"data": result}

@app.put("/api/admin/completion-requests/{request_id}/accept")
def accept_completion(
    request_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    if current_user.role != "admin":
        raise HTTPException(403, "Admin only")

    req = db.query(ProjectCompletionRequest).filter(
        ProjectCompletionRequest.id == request_id
    ).first()

    if not req:
        raise HTTPException(404, "Request not found")

    req.status = "accepted"

    project = db.query(Project).filter(
        Project.id == req.project_id
    ).first()

    if project:
        project.status = "completed"

    db.commit()

    return {"message": "Project marked as completed"}


@app.put("/api/admin/completion-requests/{request_id}/reject")
def reject_completion(
    request_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    if current_user.role != "admin":
        raise HTTPException(403, "Admin only")

    req = db.query(ProjectCompletionRequest).filter(
        ProjectCompletionRequest.id == request_id
    ).first()

    if not req:
        raise HTTPException(404, "Request not found")

    req.status = "rejected"

    db.commit()

    return {"message": "Completion request rejected"}
#========================= Health Check =================
@app.get("/health")
def health_check():
    return {"status": "ok"}

# =========================
# RUN
# =========================
if __name__ == "__main__":
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)
