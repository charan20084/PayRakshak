from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime
from app.database.base import Base

class DemoAccount(Base):
    """
    Model representing the simulated user bank balance for the competition demo.
    Initialized with ₹2,00,000.00 (2 Lakhs).
    """
    __tablename__ = "demo_accounts"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    account_number = Column(String(50), default="4471", unique=True, nullable=False, index=True)
    account_holder = Column(String(100), default="Rahul Sharma", nullable=False)
    balance = Column(Float, default=200000.0, nullable=False)
    currency = Column(String(10), default="INR", nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
