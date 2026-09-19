from typing import Generator
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from app.core.config import settings

# Prepare dialect-specific connection arguments
is_postgres = "postgres" in settings.DATABASE_URL.lower()

engine_kwargs = {
    "pool_pre_ping": True,
    "echo": settings.DEBUG,
}

if is_postgres:
    # Supabase PostgreSQL configuration: set schema search path
    engine_kwargs["connect_args"] = {
        "options": "-c search_path=payrakshak,public"
    }
else:
    # MySQL fallback configuration
    engine_kwargs["pool_recycle"] = 3600

engine = create_engine(settings.DATABASE_URL, **engine_kwargs)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db() -> Generator[Session, None, None]:
    """
    FastAPI dependency that provides a database session per request
    and ensures proper closing on completion.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
