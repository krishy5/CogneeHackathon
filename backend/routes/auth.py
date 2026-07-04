from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import sqlite3, secrets, os
from datetime import datetime, timezone
import bcrypt

router = APIRouter(prefix="/api/auth", tags=["auth"])

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "cognee_data", "users.db")

def _conn():
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id       TEXT PRIMARY KEY,
            email    TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            name     TEXT,
            created_at TEXT
        )
    """)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS sessions (
            token   TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            created_at TEXT
        )
    """)
    conn.commit()
    return conn

def _hash(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

def _verify(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode(), hashed.encode())

class AuthRequest(BaseModel):
    email: str
    password: str
    name: str = ""

@router.post("/register")
async def register(body: AuthRequest):
    user_id = "user_" + secrets.token_hex(8)
    try:
        with _conn() as conn:
            conn.execute(
                "INSERT INTO users (id, email, password, name, created_at) VALUES (?,?,?,?,?)",
                (user_id, body.email.lower().strip(), _hash(body.password),
                 body.name or body.email.split("@")[0], datetime.now(timezone.utc).isoformat())
            )
    except sqlite3.IntegrityError:
        raise HTTPException(status_code=409, detail="Email already registered")

    token = secrets.token_hex(32)
    with _conn() as conn:
        conn.execute("INSERT INTO sessions (token, user_id, created_at) VALUES (?,?,?)",
                     (token, user_id, datetime.now(timezone.utc).isoformat()))

    return {"token": token, "user_id": user_id,
            "name": body.name or body.email.split("@")[0], "email": body.email.lower().strip()}

@router.post("/login")
async def login(body: AuthRequest):
    with _conn() as conn:
        row = conn.execute(
            "SELECT * FROM users WHERE email=?",
            (body.email.lower().strip(),)
        ).fetchone()
    if not row or not _verify(body.password, row["password"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = secrets.token_hex(32)
    with _conn() as conn:
        conn.execute("INSERT INTO sessions (token, user_id, created_at) VALUES (?,?,?)",
                     (token, row["id"], datetime.now(timezone.utc).isoformat()))

    return {"token": token, "user_id": row["id"], "name": row["name"], "email": row["email"]}

@router.post("/logout")
async def logout(token: str):
    with _conn() as conn:
        conn.execute("DELETE FROM sessions WHERE token=?", (token,))
    return {"status": "ok"}
