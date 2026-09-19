"""
Payment API Endpoints for PayRakshak.
Handles payment risk analysis, simulated transactions, simulated demo balance, and user decisions.
Integrates Phase 2 deterministic Risk Engine and Phase 3 Gemini Contextual AI analysis.
"""

from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.models.transaction import Transaction
from app.models.risk_analysis import RiskAnalysis
from app.models.account import DemoAccount
from app.schemas.payment import (
    PaymentAnalysisRequest,
    PaymentAnalysisResponse,
    AIAnalysisResult,
    DemoAccountResponse,
    PaymentConfirmationRequest,
    PaymentConfirmationResponse,
    TopUpRequest,
)
from app.services.risk_engine import risk_engine
from app.services.gemini_service import gemini_service

router = APIRouter(prefix="/api/payment", tags=["Payment Analysis"])

INITIAL_DEMO_BALANCE = 200000.0


def get_or_create_demo_account(db: Session) -> DemoAccount:
    """
    Retrieve or initialize the simulated demo account with ₹2,00,000.00 (2 Lakhs).
    """
    account = db.query(DemoAccount).filter(DemoAccount.account_number == "4471").first()
    if not account:
        account = DemoAccount(
            account_number="4471",
            account_holder="Rahul Sharma",
            balance=INITIAL_DEMO_BALANCE,
            currency="INR"
        )
        db.add(account)
        db.commit()
        db.refresh(account)
    return account


@router.get("/balance", response_model=DemoAccountResponse)
async def get_demo_balance(db: Session = Depends(get_db)):
    """
    Retrieve the current simulated/demo bank balance (Initial: ₹2,00,000.00).
    """
    account = get_or_create_demo_account(db)
    return DemoAccountResponse(
        account_number=account.account_number,
        account_holder=account.account_holder,
        available_balance=float(account.balance),
        currency=account.currency,
        is_demo=True
    )


@router.post("/balance/reset", response_model=DemoAccountResponse)
async def reset_demo_balance(db: Session = Depends(get_db)):
    """
    Reset simulated demo bank balance back to the starting ₹2,00,000.00.
    """
    account = get_or_create_demo_account(db)
    account.balance = INITIAL_DEMO_BALANCE
    db.commit()
    db.refresh(account)
    return DemoAccountResponse(
        account_number=account.account_number,
        account_holder=account.account_holder,
        available_balance=float(account.balance),
        currency=account.currency,
        is_demo=True
    )


@router.post("/balance/topup", response_model=DemoAccountResponse)
async def topup_demo_balance(
    request: TopUpRequest,
    db: Session = Depends(get_db)
):
    """
    Add funds / Top-up simulated demo bank balance for presentation demonstrations.
    """
    account = get_or_create_demo_account(db)
    account.balance = float(account.balance) + float(request.amount)
    db.commit()
    db.refresh(account)
    return DemoAccountResponse(
        account_number=account.account_number,
        account_holder=account.account_holder,
        available_balance=float(account.balance),
        currency=account.currency,
        is_demo=True
    )


@router.post("/analyze", response_model=PaymentAnalysisResponse, status_code=status.HTTP_200_OK)
async def analyze_payment(
    request: PaymentAnalysisRequest,
    db: Session = Depends(get_db)
):
    """
    Evaluate an incoming payment attempt for Authorised Push Payment (APP) scam risk.
    Note: Does NOT deduct the balance during analysis.
    """
    try:
        # 1. Run the deterministic risk engine evaluation (owns score, level, action)
        eval_input = request.model_dump()
        assessment = risk_engine.evaluate_payment(eval_input)

        # 2. Invoke Gemini for AI contextual interpretation (non-blocking fallback guaranteed)
        ai_result_dict = await gemini_service.analyze_context(
            transaction_data=eval_input,
            signals=assessment["signals"],
            risk_level=assessment["risk_level"]
        )
        ai_analysis_obj = AIAnalysisResult(**ai_result_dict)

        # 3. Persist the transaction record in MySQL (initially marked ANALYZED)
        txn_time = request.transaction_time or datetime.now()
        new_txn = Transaction(
            amount=request.amount,
            beneficiary=request.beneficiary,
            new_beneficiary=request.new_beneficiary,
            new_device=request.new_device,
            transactions_last_10_min=request.transactions_last_10_min,
            previous_average=request.previous_average,
            location_changed=request.location_changed,
            status="ANALYZED",
            transaction_time=txn_time,
            created_at=datetime.now()
        )
        db.add(new_txn)
        db.flush()

        # 4. Persist the risk analysis record linked to the transaction
        new_analysis = RiskAnalysis(
            transaction_id=new_txn.id,
            risk_score=assessment["risk_score"],
            risk_level=assessment["risk_level"],
            action=assessment["recommended_action"],
            triggered_signals=assessment["signals"],
            explanation=assessment["explanation"],
            ai_analysis=ai_result_dict,
            created_at=datetime.now()
        )
        db.add(new_analysis)
        db.commit()
        db.refresh(new_txn)

        # 5. Return structured response combining deterministic scoring + AI context
        return PaymentAnalysisResponse(
            transaction_id=new_txn.id,
            amount=new_txn.amount,
            beneficiary=new_txn.beneficiary,
            risk_score=assessment["risk_score"],
            risk_level=assessment["risk_level"],
            signals=assessment["signals"],
            explanation=assessment["explanation"],
            recommended_action=assessment["recommended_action"],
            ai_analysis=ai_analysis_obj,
            created_at=new_txn.created_at
        )

    except Exception as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error evaluating payment risk: {str(exc)}"
        )


@router.post("/confirm", response_model=PaymentConfirmationResponse)
async def confirm_payment(
    request: PaymentConfirmationRequest,
    db: Session = Depends(get_db)
):
    """
    Perform simulated balance verification and deduction upon user confirmation.
    
    If amount <= current_balance:
      - Deducts amount from simulated account
      - Marks transaction as CONFIRMED
      - Returns status SUCCESS with remaining balance
    If amount > current_balance:
      - Does NOT deduct anything
      - Marks transaction as FAILED_INSUFFICIENT_FUNDS
      - Returns status INSUFFICIENT_FUNDS
    """
    try:
        account = get_or_create_demo_account(db)
        current_bal = float(account.balance)
        req_amount = float(request.amount)

        # Fetch transaction if id provided
        txn = None
        if request.transaction_id:
            txn = db.query(Transaction).filter(Transaction.id == request.transaction_id).first()

        # Case 1: Insufficient Balance
        if req_amount > current_bal:
            if txn:
                txn.status = "FAILED_INSUFFICIENT_FUNDS"
                db.commit()

            return PaymentConfirmationResponse(
                status="INSUFFICIENT_FUNDS",
                success=False,
                message="Your available demo balance is too low to complete this payment.",
                transaction_id=request.transaction_id,
                amount=req_amount,
                previous_balance=current_bal,
                remaining_balance=current_bal,
                deducted=False
            )

        # Case 2: Sufficient Balance
        new_balance = round(current_bal - req_amount, 2)
        account.balance = new_balance

        if txn:
            txn.status = "CONFIRMED"

        db.commit()
        db.refresh(account)

        return PaymentConfirmationResponse(
            status="SUCCESS",
            success=True,
            message="Simulated payment completed successfully.",
            transaction_id=request.transaction_id,
            amount=req_amount,
            previous_balance=current_bal,
            remaining_balance=new_balance,
            deducted=True
        )

    except Exception as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing payment confirmation: {str(exc)}"
        )
