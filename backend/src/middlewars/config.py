import sys
import time
import uuid
from pathlib import Path
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from loguru import logger

log_path = Path("/app/logs") if Path("/app").exists() else Path("logs")
log_path.mkdir(parents=True, exist_ok=True)

logger.remove()
logger.add(
    str(log_path / "app.log"),
    format="{message}",
    serialize=True,
    rotation="10 MB",
)
logger.add(
    sys.stdout,
    format="{message}",
    serialize=True,
    level="INFO",
    enqueue=True
)

class RequestLoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        request_id = str(uuid.uuid4())
        
        with logger.contextualize(request_id=request_id):
            logger.info(f"Incoming request: {request.method} {request.url.path}")
            start_time = time.time()

            try:
                response = await call_next(request)
                process_time = time.time() - start_time

                logger.info(
                    "Request completed",
                    extra={
                        "method": request.method,
                        "path": request.url.path,
                        "status_code": response.status_code,
                        "latency": round(process_time, 4)
                    }
                )
                response.headers["X-Request-ID"] = request_id
                return response
                
            except Exception as error:
                process_time = time.time() - start_time
                logger.exception(
                    "Request failed with exception",
                    extra={
                        "method": request.method,
                        "path": request.url.path,
                        "latency": round(process_time, 4)
                    }
                )
                raise error