from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
load_dotenv()

# Set up paths so Python can find routes and memory
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from memory import init_memory
from routes.chat import router as chat_router
from routes.ingest import router as ingest_router
from routes.dna import router as dna_router
from auth_middleware import BasicAuthMiddleware

app = FastAPI(title="StudioMind API", version="1.0.0")

# Password protection (comment out for local dev)
if os.getenv("ENABLE_AUTH", "false") == "true":
    app.add_middleware(BasicAuthMiddleware)

# CORS — allow React dev server on port 5173
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174", "http://localhost:5175", "http://localhost:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup():
    """Initialize memory system when the server starts."""
    try:
        await init_memory()
        print("Memory system initialized successfully.")
    except Exception as e:
        print(f"Error initializing memory: {e}")

# Register all route groups
app.include_router(chat_router)
app.include_router(ingest_router)
app.include_router(dna_router)

@app.get("/health")
async def health():
    return {"status": "ok"}
