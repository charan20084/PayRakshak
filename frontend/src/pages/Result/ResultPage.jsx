import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Check, XCircle, ShieldCheck } from 'lucide-react';
import MobileShell from '../../components/layout/MobileShell';
import { getSimulatedBalance } from '../../services/api';

export default function ResultPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const state = location.state || {};
  const isCancelled = state.decision === 'cancelled';
  const amount = state.amount || 8000;
  const note = state.note || 'Payment';
  const recipient = state.recipient || {
    name: 'Refund Help',
    vpa: 'refund.help@upi',
    initials: 'RH',
  };

  const [remainingBalance, setRemainingBalance] = useState(
    state.remaining_balance !== undefined ? state.remaining_balance : 200000.0
  );

  useEffect(() => {
    if (state.remaining_balance === undefined) {
      getSimulatedBalance()
        .then((res) => {
          if (res && typeof res.available_balance === 'number') {
            setRemainingBalance(res.available_balance);
          }
        })
        .catch(() => {});
    }
  }, [state.remaining_balance]);

  const txnRef = state.analysis?.transaction_id
    ? `TXN${state.analysis.transaction_id.toString().padStart(6, '0')}`
    : 'TXN872994';

  const dateString = new Date().toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <MobileShell showHeader={false} showBottomNav={false}>
      <div className="success-screen-wrapper">
        {/* Main Success / Outcome Card (Screen 4 exact reproduction) */}
        <div className="success-hero-card">
          {/* Status Halo */}
          <div
            className="success-green-check-halo"
            style={{
              background: isCancelled ? '#fde8e4' : '#e6f4ea',
              color: isCancelled ? '#c53030' : '#137333',
            }}
          >
            {isCancelled ? (
              <XCircle size={38} strokeWidth={2.5} />
            ) : (
              <Check size={38} strokeWidth={3} />
            )}
          </div>

          {/* Status Pre-title */}
          <div className="success-pretitle">
            {isCancelled ? 'TRANSACTION SAFELY CANCELLED' : 'SIMULATED PAYMENT COMPLETED'}
          </div>

          <div
            style={{
              display: 'inline-block',
              background: '#f1f5f9',
              color: '#64748b',
              fontSize: '0.68rem',
              fontWeight: 700,
              padding: '0.2rem 0.65rem',
              borderRadius: 999,
              marginBottom: '0.5rem',
              letterSpacing: '0.04em',
            }}
          >
            SIMULATED PAYMENT · NO REAL MONEY TRANSFERRED
          </div>

          {/* Bold Amount */}
          <div className="success-main-amount">
            ₹{amount.toLocaleString()}
          </div>

          {/* Recipient Pill */}
          <div className="success-recipient-pill">
            <div
              className="contact-circle"
              style={{
                width: 44,
                height: 44,
                background: '#1e5a52',
              }}
            >
              {recipient.initials || 'RH'}
            </div>
            <div>
              <strong style={{ fontSize: '0.95rem', color: '#0f172a' }}>
                {recipient.name}
              </strong>
              <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                {recipient.vpa}
              </div>
            </div>
          </div>

          {/* Detail Key-Value List */}
          <div className="detail-key-value-list">
            <div className="detail-row">
              <span className="detail-label">Reference</span>
              <span className="detail-val">{txnRef}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Paid on</span>
              <span className="detail-val">{dateString}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Note</span>
              <span className="detail-val">{note}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Remaining Demo Balance</span>
              <strong className="detail-val" style={{ color: '#0f172a', fontFamily: 'var(--font-serif)', fontSize: '0.95rem' }}>
                ₹{remainingBalance.toLocaleString()}
              </strong>
            </div>
          </div>

          {/* Primary "Done" Button */}
          <button className="primary-dark-action-btn" onClick={() => navigate('/')}>
            Done
          </button>

          {/* Secondary Link to History */}
          <div style={{ marginTop: '1.25rem' }}>
            <button
              onClick={() => navigate('/history')}
              style={{
                background: 'none',
                border: 'none',
                color: '#334155',
                fontSize: '0.88rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              View transaction details in Passbook
            </button>
          </div>
        </div>
      </div>
    </MobileShell>
  );
}
