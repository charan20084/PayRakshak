from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime
from sqlalchemy.orm import relationship
from app.database.base import Base

class Transaction(Base):
    """
    Model representing an evaluated payment transaction for APP scam risk detection.
    """
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    amount = Column(Float, nullable=False)
    beneficiary = Column(String(255), nullable=False, index=True)
    new_beneficiary = Column(Boolean, default=False, nullable=False)
    new_device = Column(Boolean, default=False, nullable=False)
    transactions_last_10_min = Column(Integer, default=0, nullable=False)
    previous_average = Column(Float, default=0.0, nullable=False)
    location_changed = Column(Boolean, default=False, nullable=False)
    status = Column(String(50), default="ANALYZED", nullable=True)
    transaction_time = Column(DateTime, default=datetime.utcnow, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # 1-to-1 relationship with RiskAnalysis
    risk_analysis = relationship("RiskAnalysis", back_populates="transaction", uselist=False, cascade="all, delete-orphan")
