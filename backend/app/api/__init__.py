from app.api.payment import router as payment_router
from app.api.risk import router as risk_router
from app.api.history import router as history_router

__all__ = ["payment_router", "risk_router", "history_router"]
