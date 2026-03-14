from fastapi import FastAPI
from src.auth.router import router as auth_router
from src.users.router import router as user_router
from src.admin.router import router as admin_router
from src.auth.provider import AppProvider
from src.database.provider import DatabaseProvider
from src.programs.provider import ProgramProvider
from src.programs.router import router as program_router
from dishka import make_async_container
from src.config import settings
from src.middlewars.config import RequestLoggingMiddleware
from dishka.integrations.fastapi import setup_dishka
from prometheus_fastapi_instrumentator import Instrumentator
from src.database.config import create_db_and_tables
from loguru import logger
import uvicorn
import random
from contextlib import asynccontextmanager


app = FastAPI(
    title="eStatya",
    summary="HacktheRoomAPI for fecth data from backend. LoL :3",
    version="0.0.1",
    root_path="/api/v1",
    openapi_url="/openapi.json",
    redirect_slashes=True,
    docs_url="/docs"
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    await create_db_and_tables()
    yield

app = FastAPI(lifespan=lifespan, title="HacktheRoomAPI")

app.add_middleware(RequestLoggingMiddleware)

container = make_async_container(
    AppProvider(),
    DatabaseProvider(DATABASE_URL=settings.DATABASE_URL),
    ProgramProvider()
)

setup_dishka(container, app)

Instrumentator().instrument(app=app).expose(
    app=app,
    endpoint="/api/v1/metrics"
    )

app.include_router(
    auth_router,
    prefix="/api/v1/auth",
    tags=["auth"]
    )

app.include_router(
    program_router,
    prefix="/api/v1/programs",
    tags=["programs"]
)

# app.include_router(
#     user_router,
#     prefix="/api/v1/users",
#     tags=["users"]
# )
# app.include_router(
#     post_router,
#     prefix="/api/v1/posts",
#     tags=["posts"]
# )

# app.include_router(
#     admin_router,
#     prefix="/api/v1/admins",
#     tags=["admins"]
# )

# app.include_router(
#     avatar_router,
#     prefix="/api/v1/users",
#     tags=["avatars"]
# )

@app.get("/api/v1/")
async def root():
    return {
        "status": "ok",
    }

logger.info("FastAPI application successfully started and Loguru is working!")

@app.get("/api/v1/health")
async def health_check():
    latency = round(random.uniform(0.1, 0.9), 3)
    logger.info(
        "Succesful request",
        extra={
            "endpoint": "/api/v1/health",
            "status_code": 200,
            "latency": latency
        }
        )
    return {"health": "good"}

@app.get("/api/v1/error")
async def error_check():
    logger.error(
        "Database connection failed!",
        extra={
            "endpoint": "/api/v1/error",
            "status_code": 500,
            "db_host": "localhost"}
            )
    return {"error": "Boom!"}

if __name__ == "__main__":
    uvicorn.run(
        app=app,
        host="127.0.0.1",
        port=8000
    )
