import os
from typing import List
from pydantic_settings import BaseSettings
from pydantic import Field

class Settings(BaseSettings):
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    HOST: str = "127.0.0.1"
    PORT: int = 8000

    # CORS configuration
    CORS_ORIGINS: str = "http://localhost:5173,http://127.0.0.1:5173"

    # Database configuration (MySQL via PyMySQL)
    DATABASE_URL: str = Field(
        default="mysql+pymysql://root:password@localhost:3306/payrakshak",
        description="SQLAlchemy database connection string"
    )

    # Gemini API Key (loaded from GEMINI_API_KEY environment variable)
    GEMINI_API_KEY: str = Field(
        default="",
        description="Google Gemini API key for contextual risk analysis"
    )

    @property
    def cors_origin_list(self) -> List[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
