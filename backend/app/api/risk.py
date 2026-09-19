"""Risk analysis API endpoints."""

from fastapi import APIRouter
from app.schemas.risk import RiskAnalysisRequest, RiskAnalysisResponse
from app.services.risk_engine import risk_engine

router = APIRouter(prefix="/api/risk", tags=["Risk Analysis"])

@router.post("/evaluate", response_model=RiskAnalysisResponse)
async def evaluate_risk(request: RiskAnalysisRequest):
    """
    Endpoint to trigger multi-signal risk evaluation on a simulated transaction.
    """
    result = await risk_engine.evaluate_transaction(request)
    return result
