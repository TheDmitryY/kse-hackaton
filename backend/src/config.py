from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional
from loguru import logger

class Settings(BaseSettings):
    app_name: str = "Hacktheroom"
    admin_email: str = "test@example.com"
    log_level: str = "INFO"
    PROD_REDIS_ACCOUNT_PASSWORD: str
    DATABASE_URL: str
    MINIO_ENDPOINT_URL: str
    MINIO_BUCKET_NAME: str
    AWS_ACCESS_KEY_ID: str
    AWS_SECRET_ACCESS_KEY: str
    REGION_NAME: str
    
    GEMINI_API_KEY: str
    CHROMA_HOST: str = "kse_chromadb"
    CHROMA_PORT: int = 8000
    LLM_MODEL: str = "gemini-1.5-pro"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()


logger.info(f"Application name {settings.app_name}")
logger.info(f"Application name {settings.admin_email}")
logger.info(f"Application name {settings.log_level}")