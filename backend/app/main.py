from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.constants import APP_TITLE, APP_DESCRIPTION, APP_VERSION, SERVICE_NAME, SAFETY_DISCLAIMER
from app.api.payment import router as payment_router
from app.api.risk import router as risk_router
from app.api.history import router as history_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Auto-create tables on startup if database is accessible
    try:
        from sqlalchemy import text
        from app.database.connection import engine, is_postgres
        from app.database.base import Base
        import app.models  # ensure models are registered
        if is_postgres:
            with engine.connect() as conn:
                conn.execute(text("CREATE SCHEMA IF NOT EXISTS payrakshak;"))
                conn.commit()
        Base.metadata.create_all(bind=engine)
        print("[Database] Schema check/initialization completed successfully.")
    except Exception as exc:
        print(f"[Database Warning] Database initialization check: {exc}")
    yield

app = FastAPI(
    title=APP_TITLE,
    description=f"{APP_DESCRIPTION}\n\n**Note**: {SAFETY_DISCLAIMER}",
    version=APP_VERSION,
    lifespan=lifespan
)

# Configure CORS so local frontend can communicate with FastAPI
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Standard health endpoints
@app.get("/health", tags=["Health"])
@app.get("/api/health", tags=["Health"])
async def get_health():
    """
    Health check endpoint returning service status.
    """
    return {
        "status": "ok",
        "service": SERVICE_NAME
    }

# Register API Routers
app.include_router(payment_router)
app.include_router(risk_router)
app.include_router(history_router)

@app.get("/", tags=["Root"])
async def root():
    return {
        "service": SERVICE_NAME,
        "message": "Welcome to PayRakshak (AREA51) Simulated Safety API.",
        "health": "/health",
        "docs": "/docs"
    }
