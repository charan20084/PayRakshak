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
    CORS_ORIGINS: str = (
        "http://localhost:5173,http://127.0.0.1:5173,"
        "http://localhost:8080,http://127.0.0.1:8080,"
        "http://localhost:3000,http://127.0.0.1:3000,"
        "https://pay-rakshak.vercel.app"
    )

    # Database configuration (Supabase PostgreSQL via Psycopg2 or MySQL fallback)
    DATABASE_URL: str = Field(
        default="postgresql+psycopg2://postgres.gelufrsfozrfhqhoravs:password@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres",
        description="SQLAlchemy database connection string"
    )

    # Gemini API Key (loaded from GEMINI_API_KEY environment variable)
    GEMINI_API_KEY: str = Field(
        default="",
        description="Google Gemini API key for contextual risk analysis"
    )

    @property
    def cors_origin_list(self) -> List[str]:
        origins: List[str] = []
        for origin in self.CORS_ORIGINS.split(","):
            cleaned = origin.strip()
            if cleaned:
                origins.append(cleaned)
                if cleaned.endswith("/"):
                    origins.append(cleaned.rstrip("/"))
                else:
                    origins.append(f"{cleaned}/")
        prod_origin = "https://pay-rakshak.vercel.app"
        if prod_origin not in origins:
            origins.extend([prod_origin, f"{prod_origin}/"])
        return list(dict.fromkeys(origins))

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
