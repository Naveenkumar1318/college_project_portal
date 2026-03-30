# app.py - Production FastAPI Backend with Alembic

import os
import logging
import re
import subprocess
from datetime import datetime, timedelta
from typing import Optional
from dotenv import load_dotenv
from fastapi import Response 
import uvicorn
from fastapi import FastAPI, Depends, HTTPException, File, UploadFile, Form, Response, Cookie
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

from pathlib import Path
from pydantic import BaseModel

# Load environment variables
load_dotenv()

# =========================
# CONFIGURATION
# =========================
DATABASE_URL = os.getenv("DATABASE_URL", "mysql+pymysql://root:@localhost/adhiyamaan_project_collab_portal")
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
engine = create_engine(DATABASE_URL, echo=False)
SessionLocal = sessionmaker(bind=engine)
Base = declarative_base()

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

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

    status = Column(Enum("pending", "active", "completed", "archived"), default="pending")
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

    status = Column(Enum("pending", "accepted", "rejected", "cancelled"), default="pending")
    reason = Column(String(255), nullable=True)

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
    allow_origins=["http://localhost:5173"],  # In production, restrict to frontend URL
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
    if ENVIRONMENT == "development":
        logger.info("Running in DEVELOPMENT mode")

        try:
            logger.info("🔧 Creating tables...")
            Base.metadata.create_all(bind=engine)
            logger.info("✅ Tables created successfully")
        except Exception as e:
            logger.error(f"❌ Table creation failed: {e}")

# =========================
# ENDPOINTS
# =========================

# --- Authentication ---
# ================= REGISTER =================
@app.post("/api/auth/register")
def register(data: RegisterRequest, db: Session = Depends(get_db)):

    # validate password
    validate_password(data.password)

    # check existing user
    existing_user = db.query(User).filter(User.user_id == data.id).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="User ID already exists")

    existing_email = db.query(User).filter(User.email == data.email).first()
    if existing_email:
        raise HTTPException(status_code=400, detail="Email already registered")

    # create user
    new_user = User(
        user_id=data.id,
        email=data.email,
        password=hash_password(data.password),
        role=data.role
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)  # ✅ good practice

    return {"message": "User registered successfully"}


# ================= LOGIN =================
@app.post("/api/auth/login", response_model=LoginResponse)
def login(data: LoginRequest, response: Response, db: Session = Depends(get_db)):

    user = db.query(User).filter(User.user_id == data.id).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if not verify_password(data.password, user.password):
        raise HTTPException(status_code=401, detail="Wrong password")

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
        secure=True if ENVIRONMENT == "production" else False,
        samesite="lax",
        max_age=7 * 24 * 60 * 60,
    )

    return {
        "access_token": access_token,
        "role": user.role
    }

# 🔴 4. Add Refresh Endpoint
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
        secure=True if ENVIRONMENT == "production" else False,
        samesite="lax",
        max_age=7 * 24 * 60 * 60,
    )

    # new access token
    new_access_token = create_access_token({
        "sub": user.user_id,
        "role": user.role
    })

    return {"access_token": new_access_token}

# 🔴 5. Add Logout API
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

@app.get("/api/auth/me")
def get_me(current_user: User = Depends(get_current_user)):
    return {
        "user_id": current_user.user_id,
        "role": current_user.role
    }

# --- Profile ---
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

# --- Project Stats ---
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

# --- Dashboard Stats (optional) ---
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

# ---create project---
# ================= CREATE PROJECT =================
@app.post("/api/projects")
def create_project(
    data: CreateProjectRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not data.title.strip():
        raise HTTPException(400, "Project title is required")

    project = Project(
        title=data.title,
        description=data.description,
        departments=data.departments,
        required_members=data.required_members,
        expected_completion=data.expected_completion,
        created_by=current_user.user_id,
        status="active"
    )

    db.add(project)
    db.commit()
    db.refresh(project)

    # add owner
    member = ProjectMember(
        project_id=project.id,
        user_id=current_user.user_id,
        role="owner"
    )

    db.add(member)
    db.commit()

    return {
        "message": "Project created successfully",
        "project_id": project.id
    }

# --- Search Projects ---
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

        # 🔍 SEARCH
        if q:
            query = query.filter(Project.title.ilike(f"%{q}%"))

        # 🔥 STATUS FILTER
        if status == "open":
            query = query.filter(Project.status == "active")
        else:
            query = query.filter(Project.status != "active")

        # 🔥 DEPARTMENT FILTER
        if department and department != "All":
            query = query.filter(Project.departments.contains([department]))

        projects = query.offset((page - 1) * limit).limit(limit).all()

        result = []

        for p in projects:

            # 🔥 GET OWNER PROFILE
            profile = db.query(UserProfile).filter(
                UserProfile.user_id == p.created_by
            ).first()

            # 🔥 GET JOIN STATUS
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
                "departments": p.departments,
                "required_members": p.required_members,
                "members_count": len(p.members),
                "expected_completion": p.expected_completion,
                "status": p.status,

                # ✅ FULL OWNER DATA
                "owner": {
                    "name": profile.name if profile else p.owner.user_id,
                    "department": profile.department if profile else None,
                    "reg_no": profile.register_no if profile else None,
                    "image": profile.image_url if profile else None
                },

                # ✅ JOIN STATUS
                "join_status": join_status,
                "reason": reason,

                # ✅ OWNER CHECK
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
        
# --- Join Project ---
@app.post("/api/projects/{project_id}/join")
def join_project(project_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):

    existing = db.query(JoinRequest).filter_by(
        project_id=project_id,
        user_id=current_user.user_id
    ).first()

    if existing:
        raise HTTPException(400, "Already requested")

    req = JoinRequest(
        project_id=project_id,
        user_id=current_user.user_id
    )

    db.add(req)
    db.commit()

    return {"message": "Request sent"}
@app.post("/api/projects/{project_id}/cancel")
def cancel_request(project_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):

    req = db.query(JoinRequest).filter_by(
        project_id=project_id,
        user_id=current_user.user_id
    ).first()

    if not req:
        raise HTTPException(404, "Request not found")

    req.status = "cancelled"
    db.commit()

    return {"message": "Cancelled"}

# --- Health Check ---
@app.get("/health")
def health_check():
    return {"status": "ok"}

# =========================
# RUN
# =========================
if __name__ == "__main__":
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)