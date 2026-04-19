"""Simple in-memory rate limiter middleware."""
import os
import time
from collections import defaultdict
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse


class RateLimitMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, default_limit: int = 60, ai_limit: int = 10, window: int = 60):
        super().__init__(app)
        self.default_limit = default_limit
        self.ai_limit = ai_limit
        self.window = window
        self._requests: dict[str, list[float]] = defaultdict(list)
        self._testing = os.environ.get("TESTING") == "1"

    def _is_limited(self, key: str, limit: int) -> bool:
        now = time.time()
        cutoff = now - self.window
        self._requests[key] = [t for t in self._requests[key] if t > cutoff]
        if len(self._requests[key]) >= limit:
            return True
        self._requests[key].append(now)
        return False

    async def dispatch(self, request: Request, call_next):
        if self._testing:
            return await call_next(request)

        client_ip = request.client.host if request.client else "unknown"
        path = request.url.path

        if "/api/ai/" in path and path != "/api/ai/settings":
            limit = self.ai_limit
            key = f"ai:{client_ip}"
        else:
            limit = self.default_limit
            key = f"default:{client_ip}"

        if self._is_limited(key, limit):
            return JSONResponse(
                status_code=429,
                content={"detail": "Too many requests. Please try again later."},
            )

        return await call_next(request)
