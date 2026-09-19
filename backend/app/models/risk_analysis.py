from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, Text, JSON, ForeignKey
from sqlalchemy.orm import relationship
from app.database.base import Base

class RiskAnalysis(Base):
    """
    Model representing the risk analysis decision and signals for a transaction.
    Stores both the Phase 2 deterministic evaluation and Phase 3 Gemini contextual appraisal.
    """
    __tablename__ = "risk_analyses"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    transaction_id = Column(Integer, ForeignKey("transactions.id", ondelete="CASCADE"), nullable=False, unique=True, index=True)
    risk_score = Column(Float, nullable=False)
    risk_level = Column(String(20), nullable=False)  # LOW, MEDIUM, HIGH
    action = Column(String(20), nullable=False)      # ALLOW, WARN, INTERVENE
    triggered_signals = Column(JSON, nullable=True)  # List/dict of detected signals
    explanation = Column(Text, nullable=True)        # Contextual explanation & warnings
    ai_analysis = Column(JSON, nullable=True)        # Gemini contextual analysis result
    created_at = Column(DateTime, default=datetime.now, nullable=False)

    # Back reference to Transaction
    transaction = relationship("Transaction", back_populates="risk_analysis")
