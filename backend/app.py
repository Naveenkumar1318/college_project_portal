# ================= FULL STUDENT PROJECT BACKEND =================

from fastapi import FastAPI, HTTPException, Depends, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.staticfiles import StaticFiles

from pydantic import BaseModel, EmailStr
from jose import jwt, JWTError
from passlib.context import CryptContext
from datetime import datetime, timedelta

from rembg import remove, new_session
from PIL import Image
from fastapi import FastAPI, HTTPException, Depends, UploadFile, File, WebSocket, WebSocketDisconnect
from datetime import datetime

import mysql.connector
import os
import random
import io

# ================= CONFIG =================

SECRET_KEY = "supersecretkey123"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

app = FastAPI()

# ================= STATIC FILES =================

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ================= REMBG SESSION =================

rembg_session = new_session()

# ================= DATABASE =================

def get_db():
    return mysql.connector.connect(
        host="localhost",
        user="root",
        password="",  # change if needed
        database="adhiyamaan_project_collab"
    )

# ================= AUTH FUNCTIONS =================

def hash_password(password):
    return pwd_context.hash(password)

def verify_password(plain, hashed):
    return pwd_context.verify(plain, hashed)

def create_access_token(data):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or Expired Token")

def get_current_user(payload: dict = Depends(verify_token)):
    db = get_db()
    cursor = db.cursor(dictionary=True)
    cursor.execute("SELECT * FROM users WHERE id=%s", (payload["user_id"],))
    user = cursor.fetchone()
    cursor.close()
    db.close()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return user

def get_transaction_db():
    db = get_db()
    db.start_transaction()
    return db

# ================= WebSocket Manager =================

class ConnectionManager:

    def __init__(self):
        self.active_connections = {}

    async def connect(self,project_id,websocket:WebSocket):
        await websocket.accept()

        if project_id not in self.active_connections:
            self.active_connections[project_id] = []

        self.active_connections[project_id].append(websocket)

    def disconnect(self,project_id,websocket):

        self.active_connections[project_id].remove(websocket)

    async def broadcast(self, project_id, message):

        connections = self.active_connections.get(project_id, [])

        for connection in connections.copy():

            try:
                await connection.send_json(message)
            except:
                connections.remove(connection)

manager = ConnectionManager()


# ================= MODELS =================

class RegisterModel(BaseModel):
    registerNumber: str
    email: EmailStr
    password: str
    role: str

class LoginModel(BaseModel):
    registerNumber: str
    password: str

class ProfileUpdate(BaseModel):
    name: str | None = None
    dob: str | None = None
    gender: str | None = None
    program: str | None = None
    department: str | None = None
    year: str | None = None
    batch: str | None = None
    mobile: str | None = None
    github: str | None = None
    linkedin: str | None = None
    instagram: str | None = None
    whatsapp: str | None = None
    email: str | None = None
    description: str | None = None 

class ChangePasswordModel(BaseModel):
    currentPassword: str
    newPassword: str
    confirmPassword: str

class ProjectCreate(BaseModel):
    title: str
    description: str
    required_members: int   

# ================= WebSocket Endpoint =================

@app.websocket("/ws/chat/{project_id}")
async def project_chat(websocket: WebSocket, project_id: int):

    await manager.connect(project_id, websocket)

    try:
        while True:

            data = await websocket.receive_json()

            # ================= TYPING EVENT =================
            if data.get("type") == "typing":

                await manager.broadcast(project_id, {
                    "type": "typing"
                })

                continue

            # ================= READ EVENT =================
            if data.get("type") == "read":

                message_id = data.get("message_id")
                user_id = data.get("user_id")

                if message_id:

                    db = get_db()
                    cursor = db.cursor()

                    cursor.execute(
                        "UPDATE project_messages SET status='read' WHERE id=%s",
                        (message_id,)
                    )

                    db.commit()
                    cursor.close()
                    db.close()

                    await manager.broadcast(project_id,{
                        "type":"read",
                        "message_id":message_id
                    })

                continue

            # ================= MESSAGE EVENT =================

            sender_id = data.get("sender_id")
            message = data.get("message")
            file_url = data.get("file_url")

            if not sender_id:
                continue

            db = get_db()
            cursor = db.cursor(dictionary=True)

            cursor.execute(
                """
                INSERT INTO project_messages
                (project_id, sender_id, message, file_url, status)
                VALUES (%s,%s,%s,%s,'sent')
                """,
                (project_id, sender_id, message, file_url)
            )

            message_id = cursor.lastrowid

            cursor.execute(
                "SELECT name FROM users WHERE id=%s",
                (sender_id,)
            )

            user = cursor.fetchone()

            db.commit()
            cursor.close()
            db.close()

            payload = {
                "id": message_id,
                "project_id": project_id,
                "sender_id": sender_id,
                "sender_name": user["name"] if user else "Unknown",
                "message": message,
                "file_url": file_url,
                "status": "sent",
                "created_at": datetime.utcnow().isoformat()
            }

            # Broadcast new message
            await manager.broadcast(project_id, payload)

            # Broadcast delivered status
            await manager.broadcast(project_id,{
                "type":"delivered",
                "message_id":message_id
            })

    except WebSocketDisconnect:

        manager.disconnect(project_id, websocket)

@app.delete("/projects/messages/{message_id}")
def delete_message(message_id:int, payload:dict=Depends(verify_token)):

    db = get_db()
    cursor = db.cursor()

    cursor.execute(
        "DELETE FROM project_messages WHERE id=%s",
        (message_id,)
    )

    db.commit()

    cursor.close()
    db.close()

    return {"message":"Deleted"}        

@app.get("/projects/{project_id}/messages")
def get_messages(project_id: int, payload: dict = Depends(verify_token)):

    db = get_db()
    cursor = db.cursor(dictionary=True)

    cursor.execute("""
        SELECT 
            pm.id,
            pm.sender_id,
            pm.message,
            pm.file_url,
            pm.created_at,
            u.name AS sender_name
        FROM project_messages pm
        JOIN users u ON pm.sender_id = u.id
        WHERE pm.project_id=%s
        ORDER BY pm.created_at ASC
    """, (project_id,))

    messages = cursor.fetchall()

    cursor.close()
    db.close()

    return messages

@app.post("/projects/{project_id}/chat-upload")
async def upload_chat_file(
    project_id: int,
    file: UploadFile = File(...),
    payload: dict = Depends(verify_token)
):

    os.makedirs("uploads/chat", exist_ok=True)

    filename = f"{project_id}_{datetime.utcnow().timestamp()}_{file.filename}"
    path = f"uploads/chat/{filename}"

    with open(path, "wb") as buffer:
        buffer.write(await file.read())

    return {"file_url": "/" + path}

# ================= REGISTER =================

@app.post("/register")
def register(user: RegisterModel):
    db = get_db()
    cursor = db.cursor(dictionary=True)

    cursor.execute("SELECT id FROM users WHERE register_number=%s", (user.registerNumber,))
    if cursor.fetchone():
        raise HTTPException(status_code=400, detail="Register Number already exists")

    hashed = hash_password(user.password)

    cursor.execute("""
        INSERT INTO users (register_number,email,password,role)
        VALUES (%s,%s,%s,%s)
    """, (user.registerNumber, user.email, hashed, user.role))

    db.commit()
    cursor.close()
    db.close()

    return {"message": "Registered Successfully"}

# ================= LOGIN =================

@app.post("/login")
def login(user: LoginModel):
    db = get_db()
    cursor = db.cursor(dictionary=True)

    cursor.execute(
        "SELECT * FROM users WHERE register_number=%s",
        (user.registerNumber,)
    )
    db_user = cursor.fetchone()

    # 🔴 User not found
    if not db_user:
        cursor.close()
        db.close()
        raise HTTPException(status_code=400, detail="Invalid credentials")

    # 🔐 Check if account is locked
    if db_user.get("account_locked") and db_user.get("lock_until"):
        if db_user["lock_until"] > datetime.utcnow():
            cursor.close()
            db.close()
            raise HTTPException(
                status_code=403,
                detail="Account temporarily locked. Try again later."
            )
        else:
            # ✅ Auto unlock if time expired
            cursor.execute("""
                UPDATE users SET
                account_locked=FALSE,
                lock_until=NULL,
                otp_attempts=0
                WHERE id=%s
            """, (db_user["id"],))
            db.commit()

    # 🔑 Verify password
    if not verify_password(user.password, db_user["password"]):
        cursor.close()
        db.close()
        raise HTTPException(status_code=400, detail="Invalid credentials")

    # 🎟 Generate JWT token
    token = create_access_token({
        "user_id": db_user["id"],
        "role": db_user["role"]
    })

    cursor.close()
    db.close()

    return {
        "access_token": token,
        "role": db_user["role"]
    }

# ================= DASHBOARD =================

@app.get("/dashboard/student")
def student_dashboard(payload: dict = Depends(verify_token)):

    db = get_db()
    cursor = db.cursor(dictionary=True)

    user_id = payload["user_id"]

    # Current Open Projects
    cursor.execute("""
        SELECT COUNT(*) as count FROM projects
        WHERE created_by=%s AND status='OPEN'
    """, (user_id,))
    current_projects = cursor.fetchone()["count"]

    # Completed Projects
    cursor.execute("""
        SELECT COUNT(*) as count FROM projects
        WHERE created_by=%s AND status='COMPLETED'
    """, (user_id,))
    completed_projects = cursor.fetchone()["count"]

    # Join Requests
    cursor.execute("""
        SELECT COUNT(*) as count FROM join_requests jr
        JOIN projects p ON jr.project_id = p.id
        WHERE p.created_by=%s AND jr.status='WAITING'
    """, (user_id,))
    join_requests = cursor.fetchone()["count"]

    cursor.close()
    db.close()

    return {
        "current_projects": current_projects,
        "completed_projects": completed_projects,
        "join_requests": join_requests
    }

# ================= PROJECTS =================

@app.post("/projects/create")
def create_project(data: ProjectCreate, payload: dict = Depends(verify_token)):

    db = get_transaction_db()
    cursor = db.cursor(dictionary=True)

    try:
        # Insert project
        cursor.execute("""
            INSERT INTO projects (title, description, team_limit, created_by, status, progress)
            VALUES (%s,%s,%s,%s,'OPEN',0)
        """, (
            data.title,
            data.description,
            data.required_members,
            payload["user_id"]
        ))

        project_id = cursor.lastrowid

        # Add owner as member
        cursor.execute("""
            INSERT INTO project_members (project_id, student_id, is_owner)
            VALUES (%s,%s,TRUE)
        """, (project_id, payload["user_id"]))

        # Audit Log
        cursor.execute("""
            INSERT INTO audit_logs (user_id, action, entity_type, entity_id, new_value)
            VALUES (%s,'CREATE_PROJECT','project',%s,%s)
        """, (payload["user_id"], project_id, data.title))

        # Activity Feed
        cursor.execute("""
            INSERT INTO activity_feed (project_id, user_id, message)
            VALUES (%s,%s,%s)
        """, (project_id, payload["user_id"], "Project created"))

        # Project History (Version 1)
        cursor.execute("""
            INSERT INTO project_history 
            (project_id, version, title, description, team_limit, status, progress, changed_by, change_note)
            VALUES (%s,1,%s,%s,%s,'OPEN',0,%s,'Initial version')
        """, (
            project_id,
            data.title,
            data.description,
            data.required_members,
            payload["user_id"]
        ))

        db.commit()

        return {"message": "Project Created Successfully"}

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

    finally:
        cursor.close()
        db.close()

@app.get("/projects/my")
def my_projects(payload: dict = Depends(verify_token)):

    db = get_db()
    cursor = db.cursor(dictionary=True)

    user_id = payload["user_id"]

    # Current Projects (OPEN + IN_PROGRESS)
    cursor.execute("""
        SELECT * FROM projects
        WHERE created_by=%s 
        AND is_deleted=FALSE
        AND status IN ('OPEN','IN_PROGRESS')
    """, (user_id,))
    current = cursor.fetchall()

    # Completed Projects
    cursor.execute("""
        SELECT * FROM projects
        WHERE created_by=%s
        AND is_deleted=FALSE
        AND status='COMPLETED'
    """, (user_id,))
    completed = cursor.fetchall()

    cursor.close()
    db.close()

    return {
        "current": current,
        "completed": completed
    }

@app.get("/projects/search")
def search_projects(payload: dict = Depends(verify_token)):

    db = get_db()
    cursor = db.cursor(dictionary=True)

    user_id = payload["user_id"]

    # Get user department
    cursor.execute("SELECT department FROM users WHERE id=%s", (user_id,))
    user = cursor.fetchone()
    user_department = user["department"] if user else None

    cursor.execute("""
        SELECT 
            p.id,
            p.title,
            p.description,
            p.team_limit,
            p.status,
            p.created_by,

            u.name AS owner_name,
            u.register_number AS owner_register_number,
            u.department AS owner_department,
            u.year AS owner_year,
            u.profile_image AS owner_image,

            (SELECT COUNT(*) 
             FROM project_members pm 
             WHERE pm.project_id = p.id) AS current_members,

            COALESCE(
                (SELECT jr.status 
                 FROM join_requests jr
                 WHERE jr.project_id = p.id 
                 AND jr.student_id = %s
                 LIMIT 1),
                'NONE'
            ) AS user_request_status

        FROM projects p
        JOIN users u ON p.created_by = u.id
        WHERE p.status IN ('OPEN','IN_PROGRESS')
        AND p.is_deleted=FALSE
        ORDER BY p.created_at DESC
    """, (user_id,))

    projects = cursor.fetchall()

    for project in projects:

        # Required departments
        cursor.execute("""
            SELECT department 
            FROM project_required_departments
            WHERE project_id=%s
        """, (project["id"],))

        required = [row["department"] for row in cursor.fetchall()]
        project["required_departments"] = required

        # Eligibility
        project["eligible"] = (
            user_department in required if required else True
        )

        # Is owner
        project["is_owner"] = project["created_by"] == user_id

    cursor.close()
    db.close()

    return projects

@app.delete("/projects/delete/{project_id}")
def delete_project(project_id: int, payload: dict = Depends(verify_token)):

    db = get_transaction_db()
    cursor = db.cursor(dictionary=True)

    try:
        cursor.execute("""
            SELECT * FROM projects
            WHERE id=%s AND created_by=%s AND is_deleted=FALSE
        """, (project_id, payload["user_id"]))

        project = cursor.fetchone()

        if not project:
            raise HTTPException(status_code=403, detail="Only owner can delete")

        # Soft delete
        cursor.execute("""
            UPDATE projects
            SET is_deleted=TRUE, deleted_at=NOW()
            WHERE id=%s
        """, (project_id,))

        # Activity Feed
        cursor.execute("""
            INSERT INTO activity_feed (project_id, user_id, message)
            VALUES (%s,%s,%s)
        """, (project_id, payload["user_id"], "Project deleted by owner"))

        # Audit Log
        cursor.execute("""
            INSERT INTO audit_logs (user_id, action, entity_type, entity_id)
            VALUES (%s,'DELETE_PROJECT','project',%s)
        """, (payload["user_id"], project_id))

        db.commit()

        return {"message": "Project Soft Deleted"}

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

    finally:
        cursor.close()
        db.close()
        

@app.post("/projects/{project_id}/request")
def send_request(project_id: int, payload: dict = Depends(verify_token)):

    db = get_db()
    cursor = db.cursor(dictionary=True)

    user_id = payload["user_id"]

    # Check project exists
    cursor.execute("SELECT * FROM projects WHERE id=%s", (project_id,))
    project = cursor.fetchone()

    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    if project["created_by"] == user_id:
        raise HTTPException(status_code=400, detail="Cannot request your own project")

    # Check duplicate
    cursor.execute("""
        SELECT * FROM join_requests
        WHERE project_id=%s AND student_id=%s
    """, (project_id, user_id))

    if cursor.fetchone():
        raise HTTPException(status_code=400, detail="Request already sent")

    cursor.execute("""
        INSERT INTO join_requests (project_id, student_id, status)
        VALUES (%s,%s,'WAITING')
    """, (project_id, user_id))

    db.commit()
    cursor.close()
    db.close()

    return {"message": "Request sent successfully"}


@app.delete("/projects/{project_id}/request")
def cancel_request(project_id: int, payload: dict = Depends(verify_token)):

    db = get_db()
    cursor = db.cursor(dictionary=True)

    cursor.execute("""
        DELETE FROM join_requests
        WHERE project_id=%s 
        AND student_id=%s 
        AND status='WAITING'
    """, (project_id, payload["user_id"]))

    db.commit()
    cursor.close()
    db.close()

    return {"message": "Request cancelled"}

@app.post("/projects/{project_id}/accept/{student_id}")
def accept_request(project_id: int, student_id: int, payload: dict = Depends(verify_token)):

    db = get_transaction_db()
    cursor = db.cursor(dictionary=True)

    try:
        owner_id = payload["user_id"]

        # 1️⃣ Verify Owner
        cursor.execute("""
            SELECT * FROM project_members
            WHERE project_id=%s 
            AND student_id=%s 
            AND is_owner=TRUE
        """, (project_id, owner_id))

        if not cursor.fetchone():
            raise HTTPException(status_code=403, detail="Only owner can accept requests")

        # 2️⃣ Check project exists & get capacity
        cursor.execute("""
            SELECT team_limit,
                   status,
                   (SELECT COUNT(*) 
                    FROM project_members 
                    WHERE project_id=%s) AS current_members
            FROM projects
            WHERE id=%s AND is_deleted=FALSE
        """, (project_id, project_id))

        project = cursor.fetchone()

        if not project:
            raise HTTPException(status_code=404, detail="Project not found")

        # 3️⃣ Prevent overfill
        if project["current_members"] >= project["team_limit"]:
            raise HTTPException(status_code=400, detail="Team is already full")

        # 4️⃣ Prevent duplicate member
        cursor.execute("""
            SELECT * FROM project_members
            WHERE project_id=%s AND student_id=%s
        """, (project_id, student_id))

        if cursor.fetchone():
            raise HTTPException(status_code=400, detail="Student already a member")

        # 5️⃣ Add member
        cursor.execute("""
            INSERT INTO project_members (project_id, student_id)
            VALUES (%s,%s)
        """, (project_id, student_id))

        # 6️⃣ Update request status
        cursor.execute("""
            UPDATE join_requests
            SET status='ACCEPTED'
            WHERE project_id=%s AND student_id=%s
        """, (project_id, student_id))

        # 7️⃣ Auto-update project status if full
        cursor.execute("""
            SELECT team_limit,
                   (SELECT COUNT(*) 
                    FROM project_members 
                    WHERE project_id=%s) AS current_members
            FROM projects
            WHERE id=%s
        """, (project_id, project_id))

        updated = cursor.fetchone()

        if updated["current_members"] >= updated["team_limit"]:
            cursor.execute("""
                UPDATE projects
                SET status='IN_PROGRESS'
                WHERE id=%s
            """, (project_id,))

        # 8️⃣ Activity Feed
        cursor.execute("""
            INSERT INTO activity_feed (project_id, user_id, message)
            VALUES (%s,%s,%s)
        """, (project_id, owner_id, "New member joined project"))

        # 9️⃣ Audit Log
        cursor.execute("""
            INSERT INTO audit_logs (user_id, action, entity_type, entity_id)
            VALUES (%s,'ACCEPT_REQUEST','project',%s)
        """, (owner_id, project_id))

        db.commit()

        return {"message": "Request Accepted Successfully"}

    except HTTPException:
        db.rollback()
        raise

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

    finally:
        cursor.close()
        db.close()
        

@app.delete("/projects/{project_id}/remove/{student_id}")
def remove_member(project_id: int, student_id: int, payload: dict = Depends(verify_token)):

    db = get_db()
    cursor = db.cursor(dictionary=True)

    # Check owner
    cursor.execute("""
        SELECT * FROM project_members
        WHERE project_id=%s AND student_id=%s AND is_owner=TRUE
    """, (project_id, payload["user_id"]))

    if not cursor.fetchone():
        raise HTTPException(status_code=403, detail="Only owner can remove")

    # Prevent removing owner
    cursor.execute("""
        SELECT is_owner FROM project_members
        WHERE project_id=%s AND student_id=%s
    """, (project_id, student_id))
    member = cursor.fetchone()

    if member and member["is_owner"]:
        raise HTTPException(status_code=400, detail="Cannot remove owner")

    cursor.execute("""
        DELETE FROM project_members
        WHERE project_id=%s AND student_id=%s
    """, (project_id, student_id))

    # Set project back to OPEN if below limit
    cursor.execute("""
        UPDATE projects SET status='OPEN'
        WHERE id=%s
    """, (project_id,))

    db.commit()
    cursor.close()
    db.close()

    return {"message": "Member removed"}

# ================= OWN PROJECTS =================

@app.get("/projects/own")
def get_own_projects(payload: dict = Depends(verify_token)):

    db = get_db()
    cursor = db.cursor(dictionary=True)

    user_id = payload["user_id"]

    cursor.execute("""
        SELECT 
            p.*,
            (SELECT COUNT(*) FROM project_members pm 
             WHERE pm.project_id=p.id) AS team_count
        FROM projects p
        WHERE p.created_by=%s
        AND p.is_deleted=FALSE
        ORDER BY p.created_at DESC
    """, (user_id,))

    projects = cursor.fetchall()

    cursor.close()
    db.close()

    return projects

# ================= WORK PROJECTS =================

@app.get("/projects/work")
def get_work_projects(payload: dict = Depends(verify_token)):

    db = get_db()
    cursor = db.cursor(dictionary=True)

    user_id = payload["user_id"]

    cursor.execute("""
        SELECT 
            p.*,
            u.name AS owner_name,
            m.name AS mentor_name,
            (SELECT COUNT(*) FROM project_members pm 
             WHERE pm.project_id=p.id) AS team_count
        FROM project_members pm
        JOIN projects p ON pm.project_id=p.id
        JOIN users u ON p.created_by=u.id
        LEFT JOIN users m ON p.mentor_id=m.id
        WHERE pm.student_id=%s
        AND pm.is_owner=FALSE
        AND p.is_deleted=FALSE
        ORDER BY p.created_at DESC
    """, (user_id,))

    projects = cursor.fetchall()

    cursor.close()
    db.close()

    return projects

# ================= PROJECT DETAIL =================

@app.get("/projects/{project_id}")
def project_detail(project_id: int, payload: dict = Depends(verify_token)):

    db = get_db()
    cursor = db.cursor(dictionary=True)

    # Get project
    cursor.execute("""
        SELECT * FROM projects
        WHERE id=%s AND is_deleted=FALSE
    """, (project_id,))
    project = cursor.fetchone()

    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # ================= MEMBERS =================

    cursor.execute("""
        SELECT 
            u.id,
            u.name,
            u.register_number,
            u.department,
            u.profile_image AS photo,
            pm.is_owner,
            (SELECT COUNT(*) 
             FROM project_members pm2
             JOIN projects p2 ON pm2.project_id=p2.id
             WHERE pm2.student_id=u.id
             AND p2.status='COMPLETED') AS completed_count
        FROM project_members pm
        JOIN users u ON pm.student_id=u.id
        WHERE pm.project_id=%s
    """, (project_id,))

    members = cursor.fetchall()

    # ================= JOIN REQUESTS =================

    cursor.execute("""
        SELECT 
            jr.student_id AS id,
            u.name,
            u.register_number,
            u.department,
            u.profile_image AS photo
        FROM join_requests jr
        JOIN users u ON jr.student_id = u.id
        WHERE jr.project_id = %s
        AND jr.status = 'WAITING'
    """, (project_id,))

    requests = cursor.fetchall()

    # ================= FINAL RESPONSE =================

    project["members"] = members
    project["requests"] = requests

    cursor.close()
    db.close()

    return project

# ================= UPDATE STATUS =================


@app.put("/projects/{project_id}/status")
def update_status(project_id: int, data: dict, payload: dict = Depends(verify_token)):

    db = get_db()
    cursor = db.cursor(dictionary=True)

    cursor.execute("""
        SELECT * FROM projects
        WHERE id=%s AND created_by=%s
    """, (project_id, payload["user_id"]))

    if not cursor.fetchone():
        raise HTTPException(status_code=403, detail="Only owner allowed")

    cursor.execute("""
        UPDATE projects SET status=%s
        WHERE id=%s
    """, (data["status"], project_id))

    db.commit()
    cursor.close()
    db.close()

    return {"message": "Status updated"}


# ================= GET MENTORS =================

@app.get("/mentors")
def get_mentors(payload: dict = Depends(verify_token)):

    db = get_db()
    cursor = db.cursor(dictionary=True)

    cursor.execute("""
        SELECT id, name, department
        FROM users
        WHERE role='MENTOR'
    """)

    mentors = cursor.fetchall()

    cursor.close()
    db.close()

    return mentors

# ================= REQUEST MENTOR =================

@app.post("/projects/{project_id}/mentor-request/{mentor_id}")
def request_mentor(project_id: int, mentor_id: int,
                   payload: dict = Depends(verify_token)):

    db = get_db()
    cursor = db.cursor(dictionary=True)

    # Only owner
    cursor.execute("""
        SELECT * FROM projects
        WHERE id=%s AND created_by=%s
    """, (project_id, payload["user_id"]))

    if not cursor.fetchone():
        raise HTTPException(status_code=403, detail="Only owner allowed")

    cursor.execute("""
        UPDATE projects
        SET mentor_id=%s
        WHERE id=%s
    """, (mentor_id, project_id))

    db.commit()
    cursor.close()
    db.close()

    return {"message": "Mentor assigned"}

# ================= COMPLETE PROJECT =================

@app.put("/projects/{project_id}/complete")
def complete_project(project_id: int,
                     payload: dict = Depends(verify_token)):

    db = get_transaction_db()
    cursor = db.cursor(dictionary=True)

    try:
        # Owner only
        cursor.execute("""
            SELECT * FROM projects
            WHERE id=%s AND created_by=%s
        """, (project_id, payload["user_id"]))

        if not cursor.fetchone():
            raise HTTPException(status_code=403)

        # Update project
        cursor.execute("""
            UPDATE projects
            SET status='COMPLETED'
            WHERE id=%s
        """, (project_id,))

        # Get members
        cursor.execute("""
            SELECT student_id FROM project_members
            WHERE project_id=%s
        """, (project_id,))
        members = cursor.fetchall()

        # Generate certificates
        for m in members:
            cert_url = f"/uploads/certificates/{project_id}_{m['student_id']}.pdf"

            cursor.execute("""
                INSERT INTO certificates
                (project_id, student_id, certificate_url)
                VALUES (%s,%s,%s)
            """, (project_id, m["student_id"], cert_url))

        db.commit()

        return {"message": "Project completed and certificates issued"}

    except:
        db.rollback()
        raise
    finally:
        cursor.close()
        db.close()

@app.post("/projects/{project_id}/tasks")
def create_task(project_id: int, data: dict, payload: dict = Depends(verify_token)):

    db = get_db()
    cursor = db.cursor()

    cursor.execute("""
        INSERT INTO project_tasks
        (project_id,title,description,assigned_to,deadline)
        VALUES (%s,%s,%s,%s,%s)
    """, (
        project_id,
        data["title"],
        data.get("description"),
        data.get("assigned_to"),
        data.get("deadline")
    ))

    db.commit()
    cursor.close()
    db.close()

    return {"message":"Task created"}

@app.get("/projects/{project_id}/tasks")
def get_tasks(project_id:int):

    db = get_db()
    cursor = db.cursor(dictionary=True)

    cursor.execute("""
        SELECT t.*,u.name as assigned_name
        FROM project_tasks t
        LEFT JOIN users u ON t.assigned_to=u.id
        WHERE t.project_id=%s
    """,(project_id,))

    tasks = cursor.fetchall()

    cursor.close()
    db.close()

    return tasks

@app.put("/tasks/{task_id}/status")
def update_task(task_id:int,data:dict):

    db = get_db()
    cursor = db.cursor()

    cursor.execute("""
        UPDATE project_tasks
        SET status=%s
        WHERE id=%s
    """,(data["status"],task_id))

    db.commit()
    cursor.close()
    db.close()

    return {"message":"Task updated"}

@app.post("/projects/{project_id}/milestones")
def create_milestone(project_id:int,data:dict):

    db = get_db()
    cursor = db.cursor()

    cursor.execute("""
        INSERT INTO project_milestones
        (project_id,title,description,deadline)
        VALUES (%s,%s,%s,%s)
    """,(project_id,data["title"],data.get("description"),data.get("deadline")))

    db.commit()
    cursor.close()
    db.close()

    return {"message":"Milestone created"}

@app.get("/projects/{project_id}/milestones")
def get_milestones(project_id:int):

    db = get_db()
    cursor = db.cursor(dictionary=True)

    cursor.execute("""
        SELECT * FROM project_milestones
        WHERE project_id=%s
        ORDER BY deadline ASC
    """,(project_id,))

    data = cursor.fetchall()

    cursor.close()
    db.close()

    return data    

@app.get("/notifications")
def get_notifications(payload: dict = Depends(verify_token)):
    db = get_db()
    cursor = db.cursor(dictionary=True)

    cursor.execute("""
        SELECT * FROM notifications
        WHERE user_id=%s AND is_read=FALSE
        ORDER BY created_at DESC
    """, (payload["user_id"],))

    data = cursor.fetchall()
    cursor.close()
    db.close()

    return data

@app.put("/notifications/{notification_id}/read")
def mark_read(notification_id: int, payload: dict = Depends(verify_token)):
    db = get_db()
    cursor = db.cursor()

    cursor.execute("""
        UPDATE notifications SET is_read=TRUE
        WHERE id=%s AND user_id=%s
    """, (notification_id, payload["user_id"]))

    db.commit()
    cursor.close()
    db.close()

    return {"message": "Marked as read"}
# ================= PROFILE =================

@app.get("/profile")
def get_profile(current_user: dict = Depends(get_current_user)):
    return current_user

@app.put("/profile/update")
def update_profile(data: ProfileUpdate, payload: dict = Depends(verify_token)):
    db = get_db()
    cursor = db.cursor()

    cursor.execute("""
        UPDATE users SET
        name=%s,
        dob=%s,
        gender=%s,
        program=%s,
        department=%s,
        year=%s,
        batch=%s,
        mobile=%s,
        github=%s,
        linkedin=%s,
        instagram=%s,
        whatsapp=%s,
        email=%s
        WHERE id=%s
    """, (
        data.name,
        data.dob,
        data.gender,
        data.program,
        data.department,
        data.year,
        data.batch,
        data.mobile,
        data.github,
        data.linkedin,
        data.instagram,
        data.whatsapp,
        data.email,
        payload["user_id"]
    ))

    db.commit()
    cursor.close()
    db.close()

    return {"message": "Profile Updated"}

# ================= PROFILE IMAGE UPLOAD =================

@app.post("/profile/upload-image")
async def upload_profile_image(
    file: UploadFile = File(...),
    payload: dict = Depends(verify_token)
):
    try:
        contents = await file.read()

        # Remove background
        output = remove(contents, session=rembg_session)

        filename = f"profile_{payload['user_id']}.png"
        filepath = os.path.join(UPLOAD_DIR, filename)

        with open(filepath, "wb") as f:
            f.write(output)

        # Save in database
        db = get_db()
        cursor = db.cursor()

        cursor.execute(
            "UPDATE users SET profile_image=%s WHERE id=%s",
            (f"/uploads/{filename}", payload["user_id"])
        )

        db.commit()
        cursor.close()
        db.close()

        return {"message": "Profile image uploaded successfully"}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ================= RESUME UPLOAD =================

@app.post("/profile/upload-resume")
async def upload_resume(file: UploadFile = File(...), payload: dict = Depends(verify_token)):
    os.makedirs("uploads/resume", exist_ok=True)

    file_path = f"uploads/resume/resume_{payload['user_id']}.pdf"

    with open(file_path, "wb") as buffer:
        buffer.write(await file.read())

    db = get_db()
    cursor = db.cursor()
    cursor.execute("UPDATE users SET resume_url=%s WHERE id=%s",
                   ("/" + file_path, payload["user_id"]))
    db.commit()
    cursor.close()
    db.close()

    return {"message": "Resume uploaded"}

# ================= OTP =================

@app.post("/profile/send-otp")
def send_otp(data: dict, payload: dict = Depends(verify_token)):

    db = get_db()
    cursor = db.cursor(dictionary=True)

    user_id = payload["user_id"]
    otp_type = data.get("type")

    if otp_type not in ["email", "mobile"]:
        raise HTTPException(status_code=400, detail="Invalid OTP type")

    # Check if OTP already exists for this type
    cursor.execute("""
        SELECT * FROM user_otps
        WHERE user_id=%s AND otp_type=%s
    """, (user_id, otp_type))

    existing = cursor.fetchone()

    # Cooldown check (60 sec per type)
    if existing:
        if datetime.utcnow() - existing["otp_last_sent"] < timedelta(seconds=60):
            raise HTTPException(
                status_code=429,
                detail="Wait 60 seconds before requesting OTP again"
            )

    otp = str(random.randint(100000, 999999))
    expiry = datetime.utcnow() + timedelta(minutes=5)
    now = datetime.utcnow()

    if existing:
        cursor.execute("""
            UPDATE user_otps SET
                otp_code=%s,
                otp_expiry=%s,
                otp_attempts=0,
                otp_last_sent=%s
            WHERE user_id=%s AND otp_type=%s
        """, (otp, expiry, now, user_id, otp_type))
    else:
        cursor.execute("""
            INSERT INTO user_otps
            (user_id, otp_type, otp_code, otp_expiry, otp_last_sent)
            VALUES (%s, %s, %s, %s, %s)
        """, (user_id, otp_type, otp, expiry, now))

    db.commit()
    cursor.close()
    db.close()

    print("\n==============================")
    print(f"{otp_type.upper()} OTP")
    print("User ID:", user_id)
    print("OTP:", otp)
    print("Expires in 5 minutes")
    print("==============================\n")

    return {"message": "OTP sent successfully"}

@app.post("/profile/verify-otp")
def verify_otp(data: dict, payload: dict = Depends(verify_token)):

    db = get_db()
    cursor = db.cursor(dictionary=True)

    user_id = payload["user_id"]
    otp_type = data.get("type")
    entered_otp = data.get("otp")

    if otp_type not in ["email", "mobile"]:
        raise HTTPException(status_code=400, detail="Invalid OTP type")

    cursor.execute("""
        SELECT * FROM user_otps
        WHERE user_id=%s AND otp_type=%s
    """, (user_id, otp_type))

    otp_row = cursor.fetchone()

    if not otp_row:
        cursor.close()
        db.close()
        raise HTTPException(status_code=400, detail="No OTP requested")

    # Expiry check
    if datetime.utcnow() > otp_row["otp_expiry"]:
        cursor.close()
        db.close()
        raise HTTPException(status_code=400, detail="OTP expired")

    # Attempt limit (5 tries)
    if otp_row["otp_attempts"] >= 5:
        cursor.close()
        db.close()
        raise HTTPException(
            status_code=429,
            detail="Too many failed attempts. Request new OTP."
        )

    # Incorrect OTP
    if str(otp_row["otp_code"]) != str(entered_otp):
        cursor.execute("""
            UPDATE user_otps
            SET otp_attempts = otp_attempts + 1
            WHERE id=%s
        """, (otp_row["id"],))
        db.commit()
        cursor.close()
        db.close()
        raise HTTPException(status_code=400, detail="Invalid OTP")

    # SUCCESS → mark verified
    if otp_type == "email":
        cursor.execute("""
            UPDATE users
            SET email_verified=TRUE
            WHERE id=%s
        """, (user_id,))
    else:
        cursor.execute("""
            UPDATE users
            SET mobile_verified=TRUE
            WHERE id=%s
        """, (user_id,))

    # Delete OTP after success
    cursor.execute("DELETE FROM user_otps WHERE id=%s", (otp_row["id"],))

    db.commit()
    cursor.close()
    db.close()

    return {"message": "Verified successfully"}

# ================= CHANGE PASSWORD =================

@app.put("/profile/change-password")
def change_password(data: ChangePasswordModel, payload: dict = Depends(verify_token)):

    if data.newPassword != data.confirmPassword:
        raise HTTPException(status_code=400, detail="Passwords do not match")

    db = get_db()
    cursor = db.cursor(dictionary=True)

    cursor.execute("SELECT password FROM users WHERE id=%s",
                   (payload["user_id"],))
    user = cursor.fetchone()

    if not verify_password(data.currentPassword, user["password"]):
        raise HTTPException(status_code=400, detail="Incorrect current password")

    new_hashed = hash_password(data.newPassword)

    cursor.execute("UPDATE users SET password=%s WHERE id=%s",
                   (new_hashed, payload["user_id"]))

    db.commit()
    cursor.close()
    db.close()

    return {"message": "Password updated successfully"}