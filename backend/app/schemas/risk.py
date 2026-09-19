from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class RiskReason(BaseModel):
    """Specific risk factor detected in transaction or contextual message."""
    code: str = Field(..., description="Unique code identifying the risk signal, e.g., UNFAMILIAR_PAYEE")
    category: str = Field(..., description="Category of risk: BEHAVIORAL, CONTEXTUAL, LINGUISTIC")
    description: str = Field(..., description="Human-readable explanation of why this is flagged")
    severity: str = Field(..., description="Severity level: LOW, MEDIUM, HIGH, CRITICAL")

class RiskAnalysisRequest(BaseModel):
    """Schema for requesting a risk evaluation."""
    transaction_ref: str = Field(..., description="Simulated transaction reference")
    payer_upi_id: str
    payee_upi_id: str
    payee_name: str
    amount: float
    note: Optional[str] = None
    chat_context: Optional[str] = Field(
        default=None,
        description="Optional synthetic WhatsApp/SMS message triggering the payment request"
    )

class RiskAnalysisResponse(BaseModel):
    """Schema returned after risk engine evaluation."""
    transaction_ref: str
    risk_score: float = Field(..., ge=0.0, le=100.0, description="Composite score between 0 and 100")
    risk_level: str = Field(..., description="LOW, MEDIUM, HIGH, or CRITICAL")
    reasons: List[RiskReason] = Field(default_factory=list)
    pre_payment_warning: str = Field(..., description="Plain-language advice for the user")
    recommended_action: str = Field(default="PROCEED_WITH_CAUTION", description="PROCEED, CAUTION, or STOP")
    metadata: Optional[Dict[str, Any]] = None
