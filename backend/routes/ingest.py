from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from urllib.parse import urlparse
from memory import ingest_url
import ipaddress

router = APIRouter(prefix="/api", tags=["ingest"])

ALLOWED_SCHEMES = {"http", "https"}
BLOCKED_HOSTS = {"localhost", "127.0.0.1", "0.0.0.0", "::1"}

def _validate_url(url: str) -> None:
    try:
        parsed = urlparse(url)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid URL")
    if parsed.scheme not in ALLOWED_SCHEMES:
        raise HTTPException(status_code=400, detail="URL scheme must be http or https")
    host = parsed.hostname or ""
    if host in BLOCKED_HOSTS:
        raise HTTPException(status_code=400, detail="URL points to a blocked host")
    try:
        addr = ipaddress.ip_address(host)
        if addr.is_private or addr.is_loopback or addr.is_link_local:
            raise HTTPException(status_code=400, detail="URL points to a private/internal address")
    except ValueError:
        pass  # not an IP, hostname is fine

class IngestRequest(BaseModel):
    url: str
    project_id: str

@router.post("/ingest")
async def ingest(body: IngestRequest):
    _validate_url(body.url)
    try:
        await ingest_url(body.url, body.project_id)
        return {"status": "ok", "message": f"URL ingested into project {body.project_id}"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
