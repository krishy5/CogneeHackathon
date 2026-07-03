from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from memory import fetch_memory

router = APIRouter(prefix="/api", tags=["search"])

class SearchRequest(BaseModel):
    query: str

@router.post("/search")
async def search(body: SearchRequest):
    try:
        result = await fetch_memory(body.query, "global")
        return {"results": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
