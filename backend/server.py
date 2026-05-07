from fastapi import FastAPI, APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import jwt
import bcrypt
from dotenv import load_dotenv
from pathlib import Path
import os
import logging

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ.get('DB_NAME', 'taskflow')]

# JWT Secret
JWT_SECRET = os.environ.get('JWT_SECRET', 'your-secret-key-change-me')
JWT_ALGORITHM = "HS256"
JWT_EXPIRY_HOURS = 24

# Create the main app
app = FastAPI(title="TaskFlow API", version="1.0.0")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Security
security = HTTPBearer()

# Logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


# Models
class UserPublic(BaseModel):
    id: str
    name: str
    email: str
    role: str
    created_at: str


class LoginRequest(BaseModel):
    email: str
    password: str


class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str


class AuthResponse(BaseModel):
    token: str
    user: UserPublic


# Helper functions
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def verify_password(password: str, hash: str) -> bool:
    return bcrypt.checkpw(password.encode(), hash.encode())


def create_token(user_id: str) -> str:
    payload = {
        "user_id": user_id,
        "exp": datetime.utcnow() + timedelta(hours=JWT_EXPIRY_HOURS)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def decode_token(token: str) -> dict:
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except:
        raise HTTPException(status_code=401, detail="Invalid token")


async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    token = credentials.credentials
    payload = decode_token(token)
    user_doc = await db.users.find_one({"_id": payload["user_id"]})
    if not user_doc:
        raise HTTPException(status_code=401, detail="User not found")
    return user_doc


# Auth Routes
@api_router.post("/auth/register", response_model=AuthResponse)
async def register(data: RegisterRequest):
    existing = await db.users.find_one({"email": data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_count = await db.users.count_documents({})
    role = "admin" if user_count == 0 else "member"
    
    user_id = str(uuid.uuid4())
    user_doc = {
        "_id": user_id,
        "name": data.name,
        "email": data.email,
        "password_hash": hash_password(data.password),
        "role": role,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.users.insert_one(user_doc)
    
    token = create_token(user_id)
    return {
        "token": token,
        "user": {
            "id": user_id,
            "name": data.name,
            "email": data.email,
            "role": role,
            "created_at": user_doc["created_at"]
        }
    }


@api_router.post("/auth/login", response_model=AuthResponse)
async def login(data: LoginRequest):
    user_doc = await db.users.find_one({"email": data.email})
    if not user_doc or not verify_password(data.password, user_doc["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_token(user_doc["_id"])
    return {
        "token": token,
        "user": {
            "id": user_doc["_id"],
            "name": user_doc["name"],
            "email": user_doc["email"],
            "role": user_doc["role"],
            "created_at": user_doc["created_at"]
        }
    }


@api_router.post("/auth/logout")
async def logout(current_user: dict = Depends(get_current_user)):
    return {"message": "Logged out"}


@api_router.get("/auth/me", response_model=UserPublic)
async def get_me(current_user: dict = Depends(get_current_user)):
    return {
        "id": current_user["_id"],
        "name": current_user["name"],
        "email": current_user["email"],
        "role": current_user["role"],
        "created_at": current_user["created_at"]
    }


# User Routes
@api_router.get("/users", response_model=List[UserPublic])
async def get_users(current_user: dict = Depends(get_current_user)):
    users = await db.users.find().to_list(1000)
    return [
        {
            "id": u["_id"],
            "name": u["name"],
            "email": u["email"],
            "role": u["role"],
            "created_at": u["created_at"]
        }
        for u in users
    ]


@api_router.patch("/users/{user_id}/role")
async def update_user_role(user_id: str, data: dict, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Only admins can change roles")
    
    result = await db.users.update_one(
        {"_id": user_id},
        {"$set": {"role": data.get("role", "member")}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    user_doc = await db.users.find_one({"_id": user_id})
    return {
        "id": user_doc["_id"],
        "name": user_doc["name"],
        "email": user_doc["email"],
        "role": user_doc["role"],
        "created_at": user_doc["created_at"]
    }


@api_router.delete("/users/{user_id}")
async def delete_user(user_id: str, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Only admins can delete users")
    
    result = await db.users.delete_one({"_id": user_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {"message": "User deleted"}


# Project Routes
@api_router.get("/projects")
async def get_projects(current_user: dict = Depends(get_current_user)):
    projects = await db.projects.find({
        "$or": [
            {"owner_id": current_user["_id"]},
            {"member_ids": current_user["_id"]}
        ]
    }).to_list(1000)
    return projects


@api_router.post("/projects")
async def create_project(data: dict, current_user: dict = Depends(get_current_user)):
    project_id = str(uuid.uuid4())
    project_doc = {
        "_id": project_id,
        "name": data.get("name", ""),
        "description": data.get("description", ""),
        "owner_id": current_user["_id"],
        "member_ids": data.get("member_ids", []),
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.projects.insert_one(project_doc)
    return project_doc


@api_router.get("/projects/{project_id}")
async def get_project(project_id: str, current_user: dict = Depends(get_current_user)):
    project = await db.projects.find_one({"_id": project_id})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    if project["owner_id"] != current_user["_id"] and current_user["_id"] not in project.get("member_ids", []):
        raise HTTPException(status_code=403, detail="No access")
    
    return project


@api_router.put("/projects/{project_id}")
async def update_project(project_id: str, data: dict, current_user: dict = Depends(get_current_user)):
    project = await db.projects.find_one({"_id": project_id})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    if project["owner_id"] != current_user["_id"] and current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="No access")
    
    update_data = {
        "name": data.get("name", project["name"]),
        "description": data.get("description", project.get("description")),
        "member_ids": data.get("member_ids", project.get("member_ids", [])),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.projects.update_one({"_id": project_id}, {"$set": update_data})
    return {**project, **update_data}


@api_router.delete("/projects/{project_id}")
async def delete_project(project_id: str, current_user: dict = Depends(get_current_user)):
    project = await db.projects.find_one({"_id": project_id})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    if project["owner_id"] != current_user["_id"] and current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="No access")
    
    await db.projects.delete_one({"_id": project_id})
    await db.tasks.delete_many({"project_id": project_id})
    
    return {"message": "Project deleted"}


# Task Routes
@api_router.get("/projects/{project_id}/tasks")
async def get_tasks(project_id: str, current_user: dict = Depends(get_current_user)):
    project = await db.projects.find_one({"_id": project_id})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    tasks = await db.tasks.find({"project_id": project_id}).to_list(1000)
    return tasks


@api_router.post("/projects/{project_id}/tasks")
async def create_task(project_id: str, data: dict, current_user: dict = Depends(get_current_user)):
    project = await db.projects.find_one({"_id": project_id})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    task_id = str(uuid.uuid4())
    task_doc = {
        "_id": task_id,
        "project_id": project_id,
        "title": data.get("title", ""),
        "description": data.get("description", ""),
        "status": data.get("status", "todo"),
        "priority": data.get("priority", "medium"),
        "assignee_id": data.get("assignee_id"),
        "created_by": current_user["_id"],
        "due_date": data.get("due_date"),
        "labels": data.get("labels", []),
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.tasks.insert_one(task_doc)
    return task_doc


@api_router.put("/tasks/{task_id}")
async def update_task(task_id: str, data: dict, current_user: dict = Depends(get_current_user)):
    task = await db.tasks.find_one({"_id": task_id})
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    update_data = {
        "title": data.get("title", task.get("title")),
        "description": data.get("description", task.get("description")),
        "status": data.get("status", task.get("status")),
        "priority": data.get("priority", task.get("priority")),
        "assignee_id": data.get("assignee_id"),
        "due_date": data.get("due_date"),
        "labels": data.get("labels", task.get("labels")),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.tasks.update_one({"_id": task_id}, {"$set": update_data})
    return {**task, **update_data}


@api_router.delete("/tasks/{task_id}")
async def delete_task(task_id: str, current_user: dict = Depends(get_current_user)):
    task = await db.tasks.find_one({"_id": task_id})
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    await db.tasks.delete_one({"_id": task_id})
    await db.comments.delete_many({"task_id": task_id})
    
    return {"message": "Task deleted"}


# Comment Routes
@api_router.get("/tasks/{task_id}/comments")
async def get_comments(task_id: str, current_user: dict = Depends(get_current_user)):
    comments = await db.comments.find({"task_id": task_id}).to_list(1000)
    return comments


@api_router.post("/tasks/{task_id}/comments")
async def create_comment(task_id: str, data: dict, current_user: dict = Depends(get_current_user)):
    task = await db.tasks.find_one({"_id": task_id})
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    comment_id = str(uuid.uuid4())
    comment_doc = {
        "_id": comment_id,
        "task_id": task_id,
        "user_id": current_user["_id"],
        "user_name": current_user["name"],
        "content": data.get("content", ""),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.comments.insert_one(comment_doc)
    return comment_doc


@api_router.delete("/comments/{comment_id}")
async def delete_comment(comment_id: str, current_user: dict = Depends(get_current_user)):
    comment = await db.comments.find_one({"_id": comment_id})
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    
    if comment["user_id"] != current_user["_id"] and current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="No access")
    
    await db.comments.delete_one({"_id": comment_id})
    return {"message": "Comment deleted"}


# Dashboard Route
@api_router.get("/dashboard")
async def get_dashboard(current_user: dict = Depends(get_current_user)):
    user_projects = await db.projects.find({
        "$or": [
            {"owner_id": current_user["_id"]},
            {"member_ids": current_user["_id"]}
        ]
    }).to_list(1000)
    
    project_ids = [p["_id"] for p in user_projects]
    
    all_tasks = await db.tasks.find({"project_id": {"$in": project_ids}}).to_list(10000)
    
    totals = {
        "projects": len(user_projects),
        "tasks": len(all_tasks),
        "in_progress": len([t for t in all_tasks if t.get("status") == "in_progress"]),
        "done": len([t for t in all_tasks if t.get("status") == "done"]),
        "my_open": len([t for t in all_tasks if t.get("assignee_id") == current_user["_id"] and t.get("status") != "done"]),
        "overdue": 0
    }
    
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    overdue = [t for t in all_tasks if t.get("due_date") and t.get("due_date") < today and t.get("status") != "done"]
    totals["overdue"] = len(overdue)
    
    recent_tasks = sorted(all_tasks, key=lambda x: x.get("updated_at", ""), reverse=True)[:5]
    
    return {
        "totals": totals,
        "recent_tasks": recent_tasks,
        "overdue_tasks": overdue[:5]
    }


# Include router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()


@app.get("/")
async def root():
    return {"message": "TaskFlow API is running"}

