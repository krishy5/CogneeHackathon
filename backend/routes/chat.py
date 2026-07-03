from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from agent import run_agent
from memory import improve_memory

router = APIRouter(prefix="/api", tags=["chat"])

class ChatRequest(BaseModel):
    message: str
    project_id: str

class FeedbackRequest(BaseModel):
    feedback: str   # "thumbsup: <content>" or "thumbsdown: <content>"
    project_id: str

@router.post("/chat")
async def chat(body: ChatRequest):
    try:
        return await run_agent(body.message, body.project_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/feedback")
async def feedback(body: FeedbackRequest):
    try:
        await improve_memory(body.feedback, body.project_id)
        return {"status": "ok", "message": "Memory updated"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
