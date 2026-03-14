from fastapi import Request
from fastapi.responses import JSONResponse
from src.middlewars.exceptions import AppDomainError

async def app_domain_error_handler(request: Request, exc: AppDomainError):
    return JSONResponse(
        status_code=400,
        content={
            "message": exc.message
            }
    )