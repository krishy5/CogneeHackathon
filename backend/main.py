from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
load_dotenv()

# Set up paths so Python can find routes and memory
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from memory import init_cognee
from routes.chat import router as chat_router
from routes.ingest import router as ingest_router
from routes.dna import router as dna_router
from routes.search import router as search_router
from routes.memory import router as memory_router
from routes.auth import router as auth_router
from routes.projects import router as projects_router

app = FastAPI(title="StudioMind API", version="1.0.0")

# CORS — allow all origins (hackathon deployment)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup():
    """Initialize Cognee once when the server starts."""
    try:
        await init_cognee()
        print("Cognee engine initialized successfully.")
    except Exception as e:
        print(f"Error initializing Cognee: {e}. Cognee may fail to write nodes until keys are populated.")

# Register all route groups
app.include_router(chat_router)
app.include_router(ingest_router)
app.include_router(dna_router)
app.include_router(search_router)
app.include_router(memory_router)
app.include_router(auth_router)
app.include_router(projects_router)

@app.get("/health")
async def health():
    return {"status": "ok"}
