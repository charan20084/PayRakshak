import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  ArrowLeft,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  AlertCircle,
  Lock,
  CheckCircle,
  Loader2,
  Wallet,
} from 'lucide-react';
import MobileShell from '../../components/layout/MobileShell';
import { getSimulatedBalance, confirmSimulatedPayment } from '../../services/api';

export default function ConfirmationPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const [availableBalance, setAvailableBalance] = useState(200000.0);
  const [isConfirming, setIsConfirming] = useState(false);
  const [insufficientFundsError, setInsufficientFundsError] = useState(null);

  const state = location.state || {};
  const analysis = state.analysis || {
    transaction_id: null,
    risk_score: 0.0,
    risk_level: 'LOW',
    recommended_action: 'ALLOW',
    signals: [],
    explanation: 'Payment appears consistent with the available transaction and behavioural context.',
  };

  const recipient = state.recipient || {
    name: 'Arjun',
    vpa: 'arjun@upi',
    badge: 'Friend',
    initials: 'AR',
    color: '#1e5a52',
  };

  const amount = parseFloat(state.amount) || 500;
  const note = state.note || 'Payment';
  const riskLevel = (analysis.risk_level || 'LOW').toUpperCase();

  useEffect(() => {
    getSimulatedBalance()
      .then((res) => {
        if (res && typeof res.available_balance === 'number') {
          setAvailableBalance(res.available_balance);
        }
      })
      .catch(() => {});
  }, []);

  const handleBack = () => {
    navigate(-1);
  };

  const handleCancel = () => {
    navigate('/result', {
      state: {
        decision: 'cancelled',
        analysis,
        recipient,
        amount,
        note,
        remaining_balance: availableBalance,
      },
    });
  };

  const handleConfirm = async () => {
    setIsConfirming(true);
    setInsufficientFundsError(null);

    try {
      // 1. Perform simulated balance check & atomic deduction on backend
      const result = await confirmSimulatedPayment({
        transaction_id: analysis.transaction_id || null,
        amount: amount,
      });

      setIsConfirming(false);

      if (result.status === 'INSUFFICIENT_FUNDS' || !result.success) {
        // 2. Insufficient Balance State
        setInsufficientFundsError({
          available: result.available_balance !== undefined ? result.available_balance : availableBalance,
          required: amount,
          message: result.message || 'Your available balance is too low to complete this payment.',
        });
      } else {
        // 3. Sufficient Balance -> Proceed to Result
        navigate('/result', {
          state: {
            decision: 'confirmed',
            analysis,
            recipient,
            amount,
            note,
            previous_balance: result.previous_balance,
            remaining_balance: result.remaining_balance,
          },
        });
      }
    } catch (err) {
      setIsConfirming(false);
      // Fallback local check if backend is unreachable
      if (amount > availableBalance) {
        setInsufficientFundsError({
          available: availableBalance,
          required: amount,
          message: 'Your available balance is too low to complete this payment.',
        });
      } else {
        const remaining = Math.max(0, availableBalance - amount);
        navigate('/result', {
          state: {
            decision: 'confirmed',
            analysis,
            recipient,
            amount,
            note,
            previous_balance: availableBalance,
            remaining_balance: remaining,
          },
        });
      }
    }
  };

  const getRiskBadge = () => {
    if (riskLevel === 'HIGH') {
      return {
        bg: '#fee2e2',
        color: '#b91c1c',
        border: '#fecaca',
        icon: <AlertTriangle size={14} />,
        label: `HIGH RISK (${analysis.risk_score?.toFixed(0) || '85'}/100)`,
      };
    }
    if (riskLevel === 'MEDIUM') {
      return {
        bg: '#fef3c7',
        color: '#b45309',
        border: '#fde68a',
        icon: <ShieldAlert size={14} />,
        label: `MEDIUM RISK (${analysis.risk_score?.toFixed(0) || '38'}/100)`,
      };
    }
    return {
      bg: '#e6f4ea',
      color: '#137333',
      border: '#bbf7d0',
      icon: <ShieldCheck size={14} />,
      label: `LOW RISK (${analysis.risk_score?.toFixed(0) || '0'}/100)`,
    };
  };

  const badge = getRiskBadge();

  // =========================================================================
  // INSUFFICIENT BANK BALANCE STATE (When amount > current_balance)
  // =========================================================================
  if (insufficientFundsError) {
    return (
      <MobileShell showHeader={false} showBottomNav={false}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.65rem 0 1rem' }}>
          <button className="header-icon-btn" onClick={() => navigate('/send')}>
            <ArrowLeft size={18} />
          </button>
          <div style={{ textAlign: 'center' }}>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', lineHeight: 1.1 }}>
              Payment Failed
            </h2>
            <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>SIMULATED UPI</span>
          </div>
          <div style={{ width: 36 }} />
        </div>

        <div style={{ paddingTop: '1rem', textAlign: 'center' }}>
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: '50%',
              background: '#fee2e2',
              color: '#b91c1c',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.25rem',
              boxShadow: '0 4px 18px rgba(185, 28, 28, 0.18)',
            }}
          >
            <AlertCircle size={40} strokeWidth={2.3} />
          </div>

          <div
            style={{
              display: 'inline-block',
              background: '#fee2e2',
              color: '#b91c1c',
              fontSize: '0.72rem',
              fontWeight: 800,
              padding: '0.2rem 0.65rem',
              borderRadius: 999,
              marginBottom: '0.5rem',
              letterSpacing: '0.04em',
            }}
          >
            INSUFFICIENT DEMO BALANCE
          </div>

          <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.35rem' }}>
            Insufficient Bank Balance
          </h2>
          <p style={{ fontSize: '0.86rem', color: '#64748b', maxWidth: 300, margin: '0 auto 1.5rem', lineHeight: 1.45 }}>
            {insufficientFundsError.message}
          </p>

          <div className="stitch-card" style={{ textAlign: 'left', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', paddingBottom: '0.75rem', borderBottom: '1px solid #f1f5f9' }}>
              <span className="balance-label">PAYMENT AMOUNT</span>
              <strong style={{ fontSize: '1.2rem', fontFamily: 'var(--font-serif)', color: '#b91c1c' }}>
                ₹{insufficientFundsError.required.toLocaleString()}
              </strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <span className="balance-label">AVAILABLE BALANCE</span>
              <strong style={{ fontSize: '1.1rem', fontFamily: 'var(--font-serif)', color: '#0f172a' }}>
                ₹{insufficientFundsError.available.toLocaleString()}
              </strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', color: '#64748b' }}>
              <span>Recipient:</span>
              <span><strong>{recipient.name}</strong> ({recipient.vpa})</span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            <button
              className="primary-dark-action-btn"
              onClick={() => navigate('/send')}
            >
              Back to Payment
            </button>
            <button
              onClick={() => navigate('/home')}
              style={{
                width: '100%',
                background: '#e2e8f0',
                color: '#334155',
                border: 'none',
                borderRadius: 14,
                padding: '0.85rem',
                fontSize: '0.9rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Back to Home
            </button>
          </div>
        </div>
      </MobileShell>
    );
  }

  // =========================================================================
  // STANDARD CONFIRMATION SCREEN
  // =========================================================================
  return (
    <MobileShell showHeader={false} showBottomNav={false}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.65rem 0 1rem' }}>
        <button className="header-icon-btn" onClick={handleBack} disabled={isConfirming}>
          <ArrowLeft size={18} />
        </button>
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', lineHeight: 1.1 }}>
            Confirm payment
          </h2>
          <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>UPI SIMULATION</span>
        </div>
        <div style={{ width: 36 }} />
      </div>

      <div style={{ paddingTop: '0.5rem' }}>
        {/* Main Confirmation Card */}
        <div className="stitch-card" style={{ marginBottom: '1rem' }}>
          <div style={{ textAlign: 'center', paddingBottom: '1rem', borderBottom: '1px solid #f1f5f9' }}>
            <div
              className="contact-circle"
              style={{
                width: 54,
                height: 54,
                background: recipient.color || '#1e5a52',
                margin: '0 auto 0.65rem',
                fontSize: '1.1rem',
              }}
            >
              {recipient.initials || 'AR'}
            </div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0f172a', marginBottom: 2 }}>
              {recipient.name}
            </h3>
            <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
              {recipient.vpa}
            </div>
          </div>

          <div style={{ padding: '1.25rem 0 0.5rem', textAlign: 'center' }}>
            <div className="balance-label" style={{ marginBottom: '0.25rem' }}>
              TRANSFER AMOUNT
            </div>
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: '2.5rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.5rem' }}>
              ₹{amount.toLocaleString()}
            </div>
            {note && (
              <div style={{ fontSize: '0.84rem', color: '#475569', background: '#f8fafc', padding: '0.5rem 0.75rem', borderRadius: 8, display: 'inline-block', maxWidth: '100%' }}>
                "{note}"
              </div>
            )}
          </div>

          {/* Account Balance Strip */}
          <div style={{ background: '#f8fafc', borderRadius: 12, padding: '0.65rem 0.85rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', color: '#64748b' }}>
              <Wallet size={15} color="#2563eb" />
              <span>Available Demo Balance:</span>
            </div>
            <strong style={{ fontSize: '0.92rem', color: '#0f172a', fontFamily: 'var(--font-serif)' }}>
              ₹{availableBalance.toLocaleString()}
            </strong>
          </div>

          {/* Risk Analysis Completed Badge */}
          <div style={{ marginTop: '1rem', paddingTop: '0.85rem', borderTop: '1px solid #f1f5f9' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
              <span style={{ fontSize: '0.76rem', fontWeight: 700, color: '#475569', letterSpacing: '0.04em' }}>
                SECURITY STATUS
              </span>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  background: badge.bg,
                  color: badge.color,
                  border: `1px solid ${badge.border}`,
                  padding: '0.2rem 0.6rem',
                  borderRadius: 999,
                  fontSize: '0.72rem',
                  fontWeight: 800,
                }}
              >
                {badge.icon}
                <span>{badge.label}</span>
              </div>
            </div>
            <div style={{ fontSize: '0.78rem', color: '#64748b', lineHeight: 1.4 }}>
              Risk analysis completed via PayRakshak engine.
            </div>
          </div>
        </div>

        {/* Advisory Message */}
        <div
          style={{
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: 14,
            padding: '0.85rem 1rem',
            marginBottom: '1.25rem',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.65rem',
          }}
        >
          <Lock size={16} color="#475569" style={{ flexShrink: 0, marginTop: 2 }} />
          <div>
            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0f172a', marginBottom: 2 }}>
              Review the recipient and amount before confirming.
            </div>
            <div style={{ fontSize: '0.74rem', color: '#64748b', lineHeight: 1.4 }}>
              SIMULATED PAYMENT · NO REAL MONEY TRANSFERRED.
              Balance will be deducted from your simulated account upon confirmation.
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
          <button
            className="primary-dark-action-btn"
            disabled={isConfirming}
            onClick={handleConfirm}
          >
            {isConfirming ? (
              <>
                <Loader2 size={18} className="spin-animation" />
                <span>Verifying & Confirming...</span>
              </>
            ) : (
              <>
                <span>Confirm Payment</span>
                <CheckCircle size={18} />
              </>
            )}
          </button>

          <button
            onClick={handleCancel}
            disabled={isConfirming}
            style={{
              width: '100%',
              background: '#e2e8f0',
              color: '#334155',
              border: 'none',
              borderRadius: 14,
              padding: '0.9rem',
              fontSize: '0.95rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'background 0.15s ease',
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </MobileShell>
  );
}
