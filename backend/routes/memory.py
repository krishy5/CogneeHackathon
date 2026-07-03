from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from memory import list_memories, forget_memory, get_graph

router = APIRouter(prefix="/api", tags=["memory"])

class ForgetRequest(BaseModel):
    project_id: str
    memory_id: str = None  # None = forget entire project

@router.get("/memory")
async def get_memories(project_id: str = Query(...)):
    try:
        return {"memories": await list_memories(project_id)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/memory")
async def delete_memory(body: ForgetRequest):
    try:
        count = await forget_memory(body.project_id, body.memory_id)
        return {"deleted": count}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/graph")
async def graph(project_id: str = Query(...)):
    try:
        return await get_graph(project_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
