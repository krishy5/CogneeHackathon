from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel
from typing import List
import sqlite3, os, json
from routes.auth import DB_PATH, _conn as auth_conn

router = APIRouter(prefix="/api/projects", tags=["projects"])

PROJ_DB = os.path.join(os.path.dirname(os.path.dirname(__file__)), "cognee_data", "projects.db")

def _conn():
    os.makedirs(os.path.dirname(PROJ_DB), exist_ok=True)
    conn = sqlite3.connect(PROJ_DB)
    conn.row_factory = sqlite3.Row
    conn.execute("""
        CREATE TABLE IF NOT EXISTS projects (
            id         TEXT NOT NULL,
            user_id    TEXT NOT NULL,
            name       TEXT NOT NULL,
            description TEXT,
            color      TEXT,
            created_at TEXT,
            PRIMARY KEY (id, user_id)
        )
    """)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS chats (
            id         INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id    TEXT NOT NULL,
            project_id TEXT NOT NULL,
            role       TEXT NOT NULL,
            content    TEXT NOT NULL,
            ts         INTEGER
        )
    """)
    conn.commit()
    return conn

def _get_user(token: str) -> str:
    with auth_conn() as conn:
        row = conn.execute("SELECT user_id FROM sessions WHERE token=?", (token,)).fetchone()
    if not row:
        raise HTTPException(status_code=401, detail="Invalid session")
    return row["user_id"]

class Project(BaseModel):
    id: str
    name: str
    description: str = ""
    color: str = "#8b5cf6"

class ChatMessage(BaseModel):
    role: str
    content: str
    ts: int = 0

@router.get("")
async def get_projects(authorization: str = Header(...)):
    token = authorization.replace("Bearer ", "")
    user_id = _get_user(token)
    with _conn() as conn:
        rows = conn.execute(
            "SELECT * FROM projects WHERE user_id=? ORDER BY created_at ASC", (user_id,)
        ).fetchall()
    return {"projects": [dict(r) for r in rows]}

@router.post("")
async def save_projects(projects: List[Project], authorization: str = Header(...)):
    token = authorization.replace("Bearer ", "")
    user_id = _get_user(token)
    with _conn() as conn:
        conn.execute("DELETE FROM projects WHERE user_id=?", (user_id,))
        for p in projects:
            conn.execute(
                "INSERT OR REPLACE INTO projects (id, user_id, name, description, color, created_at) VALUES (?,?,?,?,?,datetime('now'))",
                (p.id, user_id, p.name, p.description, p.color)
            )
    return {"status": "ok"}

@router.get("/{project_id}/chats")
async def get_chats(project_id: str, authorization: str = Header(...)):
    token = authorization.replace("Bearer ", "")
    user_id = _get_user(token)
    with _conn() as conn:
        rows = conn.execute(
            "SELECT role, content, ts FROM chats WHERE user_id=? AND project_id=? ORDER BY ts ASC",
            (user_id, project_id)
        ).fetchall()
    return {"chats": [dict(r) for r in rows]}

@router.post("/{project_id}/chats")
async def save_chats(project_id: str, messages: List[ChatMessage], authorization: str = Header(...)):
    token = authorization.replace("Bearer ", "")
    user_id = _get_user(token)
    with _conn() as conn:
        conn.execute("DELETE FROM chats WHERE user_id=? AND project_id=?", (user_id, project_id))
        for m in messages:
            conn.execute(
                "INSERT INTO chats (user_id, project_id, role, content, ts) VALUES (?,?,?,?,?)",
                (user_id, project_id, m.role, m.content, m.ts)
            )
    return {"status": "ok"}
