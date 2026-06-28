from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response
import base64
import os

class BasicAuthMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        # Skip auth for health checks
        if request.url.path == "/health":
            return await call_next(request)
        
        # Get password from environment
        PASSWORD = os.getenv("DEPLOY_PASSWORD", "studiomind2024")
        
        auth = request.headers.get("Authorization")
        
        if auth:
            try:
                scheme, credentials = auth.split()
                if scheme.lower() == "basic":
                    decoded = base64.b64decode(credentials).decode("utf-8")
                    username, password = decoded.split(":", 1)
                    if password == PASSWORD:
                        return await call_next(request)
            except Exception:
                pass
        
        return Response(
            content="Authentication required",
            status_code=401,
            headers={"WWW-Authenticate": 'Basic realm="StudioMind"'}
        )
