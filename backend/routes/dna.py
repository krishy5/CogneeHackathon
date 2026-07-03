from fastapi import APIRouter, HTTPException, Query
from memory import get_style_dna

router = APIRouter(prefix="/api", tags=["dna"])

@router.get("/dna")
async def dna(user_id: str = Query(..., description="The user's ID to fetch cross-project DNA")):
    try:
        result = await get_style_dna(user_id)
        return {"dna": result or ""}
    except Exception as e:
        print(f"DNA route error: {e}")
        return {"dna": ""}
