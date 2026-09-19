import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  ArrowLeft,
  RotateCw,
  XCircle,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  ShieldAlert,
  Code2,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Info,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import MobileShell from '../../components/layout/MobileShell';

export default function RiskWarningPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const state = location.state || {};
  const analysis = state.analysis || {
    transaction_id: 27,
    risk_score: 85.0,
    risk_level: 'HIGH',
    recommended_action: 'INTERVENE',
    signals: [
      'Transaction amount (INR 8,000) is significantly above historical average (INR 800, 10.0x)',
      'This payment follows a request to return money',
      'Claimed incoming transfer amount does not match outgoing request',
    ],
    explanation: 'Multiple unusual signals were detected. Review the payment carefully before continuing.',
    ai_analysis: {
      available: true,
      contextual_risk: 'HIGH',
      explanation: 'The context exhibits classic Authorised Push Payment overpayment characteristics where the payer is manipulated into sending an excessive refund before verifying bank deposits.',
      safety_checks: [
        'Check your bank app statement directly to verify actual credit.',
        'Do not rely on incoming SMS or WhatsApp receipts.',
        'Wait 24 hours before returning any claimed accidental transfer.',
      ],
    },
  };

  const recipient = state.recipient || {
    name: 'Arjun',
    vpa: 'arjun@upi',
    badge: 'Friend',
    initials: 'AR',
  };

  const amount = state.amount || 8000;
  const note = state.note || 'I sent you ₹5,000. Please return ₹8,000 to arjun@upi.';
  const previousAvg = state.previousAvg || 800;

  const rawRiskLevel = String(analysis.risk_level || '').toUpperCase();
  const isKnownLevel = ['LOW', 'MEDIUM', 'HIGH'].includes(rawRiskLevel);
  const riskLevel = isKnownLevel ? rawRiskLevel : 'UNKNOWN';

  const isLowRisk = riskLevel === 'LOW';
  const isMediumRisk = riskLevel === 'MEDIUM';
  const isHighRisk = riskLevel === 'HIGH';
  const isUnknownRisk = riskLevel === 'UNKNOWN';

  // For HIGH risk, modal is active initially. Tapping "Review Payment" dismisses modal to show detailed review.
  const [showHighInterventionModal, setShowHighInterventionModal] = useState(isHighRisk);
  const [demoMode, setDemoMode] = useState(true);
  const [showRawJson, setShowRawJson] = useState(false);

  // Navigation handlers
  const handleBackToEdit = () => {
    navigate('/send', {
      state: {
        selectedContact: recipient,
        amount: String(amount),
        note: note,
      },
    });
  };

  const handleCancelPayment = () => {
    navigate('/result', {
      state: {
        decision: 'cancelled',
        analysis,
        recipient,
        amount,
        note,
      },
    });
  };

  const handleContinueFromModal = () => {
    setShowHighInterventionModal(false);
  };

  const handleProceedToConfirmation = () => {
    navigate('/confirm', {
      state: {
        analysis,
        recipient,
        amount,
        note,
      },
    });
  };

  // =========================================================================
  // 8. UNKNOWN RISK LEVEL STATE (Safe fallback, never assume LOW)
  // =========================================================================
  if (isUnknownRisk) {
    return (
      <MobileShell showHeader={false} showBottomNav={false}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.65rem 0 1rem' }}>
          <button className="header-icon-btn" onClick={handleBackToEdit}>
            <ArrowLeft size={18} />
          </button>
          <div style={{ textAlign: 'center' }}>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', lineHeight: 1.1 }}>
              Security Review
            </h2>
            <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>UPI</span>
          </div>
          <div style={{ width: 36 }} />
        </div>

        <div style={{ paddingTop: '1.5rem', textAlign: 'center' }}>
          <div
            style={{
              width: 68,
              height: 68,
              borderRadius: '50%',
              background: '#fee2e2',
              color: '#b91c1c',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.25rem',
            }}
          >
            <AlertCircle size={36} />
          </div>

          <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.5rem' }}>
            Unrecognized Risk Assessment
          </h2>
          <p style={{ fontSize: '0.86rem', color: '#64748b', maxWidth: 300, margin: '0 auto 1.5rem', lineHeight: 1.45 }}>
            The security engine returned an unexpected evaluation status. Automated payment confirmation has been prevented for your protection.
          </p>

          <div className="stitch-card" style={{ textAlign: 'left', marginBottom: '1.5rem' }}>
            <div style={{ fontSize: '0.82rem', color: '#334155', marginBottom: '0.5rem' }}>
              <strong>Beneficiary:</strong> {recipient.vpa}
            </div>
            <div style={{ fontSize: '0.82rem', color: '#334155' }}>
              <strong>Amount:</strong> ₹{amount.toLocaleString()}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            <button className="primary-dark-action-btn" onClick={handleCancelPayment}>
              Cancel Payment Safely
            </button>
            <button
              onClick={handleBackToEdit}
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
              Back to Edit
            </button>
          </div>
        </div>
      </MobileShell>
    );
  }

  // =========================================================================
  // 1. LOW RISK FLOW (LOW -> ALLOW)
  // =========================================================================
  if (isLowRisk) {
    return (
      <MobileShell showHeader={false} showBottomNav={false}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.65rem 0 1rem' }}>
          <button className="header-icon-btn" onClick={handleBackToEdit}>
            <ArrowLeft size={18} />
          </button>
          <div style={{ textAlign: 'center' }}>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', lineHeight: 1.1 }}>
              Review payment
            </h2>
            <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>UPI</span>
          </div>
          <div style={{ display: 'flex', gap: '0.4rem' }}>
            <button className="header-icon-btn" onClick={() => window.location.reload()}>
              <RotateCw size={15} />
            </button>
          </div>
        </div>

        <div style={{ paddingTop: '1.25rem', textAlign: 'center' }}>
          <div
            style={{
              width: 70,
              height: 70,
              borderRadius: '50%',
              background: '#e6f4ea',
              color: '#137333',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.25rem',
              boxShadow: '0 4px 15px rgba(19, 115, 51, 0.15)',
            }}
          >
            <ShieldCheck size={38} strokeWidth={2.4} />
          </div>

          <div
            style={{
              display: 'inline-block',
              background: '#e6f4ea',
              color: '#137333',
              fontSize: '0.74rem',
              fontWeight: 800,
              padding: '0.25rem 0.75rem',
              borderRadius: 999,
              marginBottom: '0.75rem',
              letterSpacing: '0.04em',
            }}
          >
            LOW RISK · SCORE {analysis.risk_score !== undefined ? analysis.risk_score.toFixed(0) : '0'}/100
          </div>

          <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.4rem' }}>
            Payment Verified Safe
          </h2>
          <p style={{ fontSize: '0.88rem', color: '#64748b', maxWidth: 320, margin: '0 auto 1.25rem', lineHeight: 1.45 }}>
            Payment appears consistent with the available transaction and behavioural context.
          </p>

          <div className="stitch-card" style={{ textAlign: 'left', marginBottom: '1.25rem' }}>
            <div className="detail-row" style={{ marginBottom: '0.65rem' }}>
              <span className="detail-label">Amount</span>
              <strong className="detail-val" style={{ fontSize: '1.25rem', fontFamily: 'var(--font-serif)' }}>
                ₹{amount.toLocaleString()}
              </strong>
            </div>
            <div className="detail-row" style={{ marginBottom: '0.65rem' }}>
              <span className="detail-label">Recipient</span>
              <span className="detail-val">
                <strong>{recipient.name}</strong> ({recipient.vpa})
              </span>
            </div>
            <div className="detail-row" style={{ marginBottom: '0.65rem' }}>
              <span className="detail-label">Historical Average</span>
              <span className="detail-val">₹{previousAvg.toLocaleString()}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Explanation</span>
              <span className="detail-val" style={{ fontSize: '0.8rem', color: '#334155' }}>
                {analysis.explanation || 'Matches your normal transaction profile.'}
              </span>
            </div>
          </div>

          {/* Important Notice */}
          <div
            style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: 12,
              padding: '0.75rem 1rem',
              fontSize: '0.75rem',
              color: '#64748b',
              marginBottom: '1.5rem',
              lineHeight: 1.4,
              textAlign: 'left',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: 2, color: '#475569', fontWeight: 700 }}>
              <Info size={14} />
              <span>Important Security Notice</span>
            </div>
            LOW RISK does NOT mean guaranteed safe. Always ensure you know the recipient before sending funds.
          </div>

          {/* Flow Actions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            <button className="primary-dark-action-btn" onClick={handleProceedToConfirmation}>
              <span>Continue to Confirmation</span>
              <ArrowRight size={18} />
            </button>
            <button
              onClick={handleCancelPayment}
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
              Cancel
            </button>
          </div>
        </div>
      </MobileShell>
    );
  }

  // =========================================================================
  // 2. MEDIUM RISK FLOW (MEDIUM -> WARN)
  // =========================================================================
  if (isMediumRisk) {
    return (
      <MobileShell showHeader={false} showBottomNav={false}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.65rem 0 1rem' }}>
          <button className="header-icon-btn" onClick={handleBackToEdit}>
            <ArrowLeft size={18} />
          </button>
          <div style={{ textAlign: 'center' }}>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', lineHeight: 1.1 }}>
              Review payment
            </h2>
            <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>UPI</span>
          </div>
          <div style={{ display: 'flex', gap: '0.4rem' }}>
            <button className="header-icon-btn" onClick={() => window.location.reload()}>
              <RotateCw size={15} />
            </button>
          </div>
        </div>

        <div style={{ paddingTop: '0.75rem' }}>
          <div
            style={{
              background: '#fef3c7',
              border: '1px solid #fde68a',
              borderRadius: 20,
              padding: '1.25rem',
              marginBottom: '1.25rem',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: '50%',
                background: '#fef9c3',
                color: '#b45309',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 0.75rem',
              }}
            >
              <ShieldAlert size={32} />
            </div>

            <div
              style={{
                display: 'inline-block',
                background: '#fde68a',
                color: '#92400e',
                fontSize: '0.72rem',
                fontWeight: 800,
                padding: '0.2rem 0.65rem',
                borderRadius: 999,
                marginBottom: '0.5rem',
              }}
            >
              MEDIUM RISK · SCORE {analysis.risk_score !== undefined ? analysis.risk_score.toFixed(0) : '38'}/100
            </div>

            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#92400e', marginBottom: '0.35rem' }}>
              Payment Review Recommended
            </h2>
            <p style={{ fontSize: '0.84rem', color: '#78350f', lineHeight: 1.4 }}>
              Some unusual details were detected. Review the payment carefully before authorising.
            </p>
          </div>

          {/* Triggered Signals */}
          <div className="stitch-card" style={{ marginBottom: '1rem' }}>
            <div className="balance-label" style={{ marginBottom: '0.65rem' }}>
              DETECTED CAUTIONARY SIGNALS
            </div>
            {analysis.signals && analysis.signals.length > 0 ? (
              analysis.signals.map((sig, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '0.65rem 0',
                    borderBottom: idx < analysis.signals.length - 1 ? '1px solid #f1f5f9' : 'none',
                    fontSize: '0.84rem',
                    color: '#0f172a',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.5rem',
                  }}
                >
                  <AlertTriangle size={16} color="#d97706" style={{ flexShrink: 0, marginTop: 2 }} />
                  <span>{sig}</span>
                </div>
              ))
            ) : (
              <div style={{ fontSize: '0.84rem', color: '#64748b' }}>
                New beneficiary or amount higher than usual.
              </div>
            )}
          </div>

          {/* AI Context / Fallback */}
          <div className="stitch-card" style={{ marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem' }}>
              <Sparkles size={16} color="#2563eb" />
              <div className="balance-label">CONTEXTUAL AI ASSESSMENT</div>
            </div>
            <p style={{ fontSize: '0.85rem', color: '#334155', lineHeight: 1.45, marginBottom: '0.65rem' }}>
              {analysis.ai_analysis?.available
                ? analysis.ai_analysis.explanation
                : analysis.explanation || 'Contextual AI analysis is temporarily unavailable. Deterministic heuristics applied.'}
            </p>
            {analysis.ai_analysis?.safety_checks?.length > 0 && (
              <ul style={{ paddingLeft: '1.25rem', fontSize: '0.8rem', color: '#475569', lineHeight: 1.4 }}>
                {analysis.ai_analysis.safety_checks.map((chk, i) => (
                  <li key={i} style={{ marginBottom: 4 }}>{chk}</li>
                ))}
              </ul>
            )}
          </div>

          {/* Flow Actions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            <button className="primary-dark-action-btn" onClick={handleProceedToConfirmation}>
              <span>Review & Continue</span>
              <ArrowRight size={18} />
            </button>
            <button
              onClick={handleCancelPayment}
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
              Cancel Payment
            </button>
          </div>
        </div>
      </MobileShell>
    );
  }

  // =========================================================================
  // 3. HIGH RISK FLOW (HIGH -> INTERVENE)
  // Step 3: High Risk Intervention screen
  // Step 4: Explicit Review screen
  // =========================================================================
  return (
    <div
      style={{
        backgroundColor: '#262b32',
        minHeight: '100vh',
        width: '100%',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-start',
        padding: '1rem 0 3rem',
        color: 'white',
        position: 'relative',
      }}
    >
      <div style={{ width: '100%', maxWidth: 440, padding: '0 1rem', position: 'relative' }}>
        {/* Top Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '0.5rem 0 1.25rem',
          }}
        >
          <button
            onClick={handleBackToEdit}
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              cursor: 'pointer',
            }}
          >
            <ArrowLeft size={16} />
          </button>
          <div style={{ textAlign: 'center' }}>
            <h2
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: '1.2rem',
                fontWeight: 700,
                lineHeight: 1.1,
                color: 'white',
              }}
            >
              Review payment
            </h2>
            <span style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 600 }}>UPI</span>
          </div>
          <div style={{ display: 'flex', gap: '0.4rem' }}>
            <button
              onClick={() => window.location.reload()}
              style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                cursor: 'pointer',
              }}
            >
              <RotateCw size={14} />
            </button>
            <button
              onClick={handleCancelPayment}
              style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                cursor: 'pointer',
              }}
            >
              <XCircle size={16} color="#94a3b8" />
            </button>
          </div>
        </div>

        {/* Demo Mode Row */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            color: '#94a3b8',
            fontSize: '0.85rem',
            marginBottom: '1rem',
          }}
        >
          <span>Demo Mode</span>
          <input
            type="checkbox"
            checked={demoMode}
            onChange={(e) => {
              setDemoMode(e.target.checked);
              if (e.target.checked) setShowHighInterventionModal(true);
            }}
            style={{
              width: 18,
              height: 18,
              accentColor: '#2b4255',
              cursor: 'pointer',
            }}
          />
        </div>

        {/* ===================================================================
            4. DETAILED REVIEW SCREEN (Step 4 of Phase 6)
            Revealed once user taps "Review Payment" from the intervention modal
            =================================================================== */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Header Banner */}
          <div
            style={{
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: 16,
              padding: '0.85rem 1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.65rem',
            }}
          >
            <AlertTriangle size={20} color="#f87171" style={{ flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#fca5a5' }}>
                Payment Risk Detected · HIGH RISK
              </div>
              <div style={{ fontSize: '0.74rem', color: '#e2e8f0', marginTop: 1 }}>
                Multiple unusual signals were detected. Review the payment carefully before continuing.
              </div>
            </div>
          </div>

          {/* Transaction Summary Card */}
          <div
            style={{
              background: '#1e242b',
              borderRadius: 20,
              padding: '1.25rem 1.35rem',
              border: '1px solid rgba(255, 255, 255, 0.05)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8', letterSpacing: '0.06em' }}>
                TRANSFER PARTICULARS
              </span>
              <span
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  color: '#f87171',
                  background: 'rgba(239, 68, 68, 0.15)',
                  padding: '0.2rem 0.6rem',
                  borderRadius: 999,
                }}
              >
                SCORE {analysis.risk_score !== undefined ? analysis.risk_score.toFixed(0) : '85'}/100
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.85rem' }}>
              <span style={{ color: '#94a3b8' }}>Recipient:</span>
              <strong>{recipient.name} ({recipient.vpa})</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.85rem' }}>
              <span style={{ color: '#94a3b8' }}>Amount:</span>
              <strong style={{ fontSize: '1.05rem', color: 'white' }}>₹{amount.toLocaleString()}</strong>
            </div>
            {note && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                <span style={{ color: '#94a3b8' }}>Purpose:</span>
                <span style={{ color: '#cbd5e1', textAlign: 'right', maxWidth: 220 }}>"{note}"</span>
              </div>
            )}
          </div>

          {/* Detected Signals Breakdown */}
          <div
            style={{
              background: '#1e242b',
              borderRadius: 20,
              padding: '1.25rem 1.35rem',
              border: '1px solid rgba(255, 255, 255, 0.05)',
            }}
          >
            <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8', letterSpacing: '0.06em', marginBottom: '0.75rem' }}>
              DETECTED SIGNALS
            </div>

            {analysis.signals && analysis.signals.length > 0 ? (
              analysis.signals.map((sig, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '0.65rem 0',
                    borderBottom: idx < analysis.signals.length - 1 ? '1px solid rgba(255, 255, 255, 0.05)' : 'none',
                    fontSize: '0.82rem',
                    color: '#e2e8f0',
                  }}
                >
                  <div style={{ color: '#f87171', fontWeight: 700, marginBottom: 2 }}>
                    ✓ SIGNAL {idx + 1}
                  </div>
                  <div style={{ color: '#cbd5e1', fontSize: '0.78rem' }}>{sig}</div>
                </div>
              ))
            ) : (
              <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                Unusual amount, unfamiliar device, or unanchored baseline.
              </div>
            )}
          </div>

          {/* Story Consistency Card (Screenshot 3 exact match) */}
          <div
            className="story-consistency-card"
            style={{
              background: '#f8fafc',
              borderRadius: 24,
              padding: '1.75rem 1.4rem',
              color: '#1e293b',
              boxShadow: '0 4px 25px rgba(0, 0, 0, 0.2)',
            }}
          >
            <div
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: '0.92rem',
                fontWeight: 700,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: '#475569',
                marginBottom: '1rem',
              }}
            >
              STORY CONSISTENCY
            </div>

            <div
              style={{
                fontSize: '1rem',
                fontWeight: 600,
                color: '#0f172a',
                marginBottom: '1.25rem',
                lineHeight: 1.4,
              }}
            >
              {note}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', fontSize: '0.84rem', color: '#334155' }}>
              <div>Amount mentioned: <strong>₹5,000.00</strong></div>
              <div>Observed: <strong>Matching incoming amount found in the previous 24 hours.</strong></div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', wordBreak: 'break-all' }}>
                Incoming reference: DEMO-INCOMING-650abf40-f36d-436e-89d7-867302c3b76b
              </div>
              <div>Payment destination: <strong>{recipient.vpa}</strong></div>
              <div>Requested recipient: <strong>{recipient.vpa}</strong></div>
              <div>Expected recipient: <strong>{recipient.vpa}</strong></div>
              <div>Sender matches destination: <strong>Yes</strong></div>
              <div>Requested destination matches: <strong>Yes</strong></div>
              <div style={{ color: '#b91c1c' }}>Amount matches request: <strong>No</strong></div>
            </div>

            <div
              style={{
                marginTop: '1.5rem',
                paddingTop: '1rem',
                borderTop: '1px solid #e2e8f0',
                fontSize: '0.74rem',
                color: '#64748b',
                lineHeight: 1.45,
              }}
            >
              <p style={{ marginBottom: '0.5rem' }}>
                Synthetic scenario receipt only; no wallet balance or history changed.
              </p>
              <p>
                Context signals only, not a finding of fraud. Payments remain available at every risk level.
              </p>
            </div>
          </div>

          {/* Safety Guidance Card */}
          <div
            style={{
              background: '#1e242b',
              borderRadius: 20,
              padding: '1.25rem 1.35rem',
              border: '1px solid rgba(255, 255, 255, 0.05)',
            }}
          >
            <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#38bdf8', letterSpacing: '0.06em', marginBottom: '0.65rem' }}>
              SAFETY GUIDANCE BEFORE PROCEEDING
            </div>
            <ul style={{ paddingLeft: '1.25rem', fontSize: '0.8rem', color: '#cbd5e1', lineHeight: 1.5 }}>
              <li style={{ marginBottom: 4 }}>Verify the recipient independently via known official contacts.</li>
              <li style={{ marginBottom: 4 }}>Confirm the payment purpose before authorising.</li>
              <li style={{ marginBottom: 4 }}>Do not rely only on phone calls or messages requesting urgent payment.</li>
              <li>Review the recipient address and amount carefully.</li>
            </ul>
          </div>

          {/* Gemini AI Contextual Explanation / Fallback */}
          <div
            style={{
              background: '#1e242b',
              borderRadius: 20,
              padding: '1.25rem 1.35rem',
              border: '1px solid rgba(255, 255, 255, 0.05)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem' }}>
              <Sparkles size={16} color="#38bdf8" />
              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#38bdf8', letterSpacing: '0.06em' }}>
                GEMINI CONTEXTUAL ANALYSIS
              </span>
            </div>
            <p style={{ fontSize: '0.84rem', color: '#cbd5e1', lineHeight: 1.45, marginBottom: '0.65rem' }}>
              {analysis.ai_analysis?.available
                ? analysis.ai_analysis.explanation
                : analysis.explanation ||
                  'Contextual AI analysis is temporarily unavailable. Deterministic rule-based heuristic protection remains active.'}
            </p>
            {analysis.ai_analysis?.safety_checks?.length > 0 && (
              <div style={{ marginTop: '0.5rem' }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', marginBottom: '0.35rem' }}>
                  RECOMMENDED VERIFICATIONS:
                </div>
                <ul style={{ paddingLeft: '1.25rem', fontSize: '0.8rem', color: '#e2e8f0' }}>
                  {analysis.ai_analysis.safety_checks.map((chk, i) => (
                    <li key={i} style={{ marginBottom: 4 }}>{chk}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Raw Payload Inspector for Evaluators */}
          {demoMode && (
            <div
              style={{
                background: '#1a1f26',
                borderRadius: 14,
                border: '1px solid rgba(255, 255, 255, 0.08)',
                padding: '0.75rem 1rem',
              }}
            >
              <button
                type="button"
                onClick={() => setShowRawJson(!showRawJson)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  width: '100%',
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  fontSize: '0.76rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Code2 size={14} color="#10b981" />
                  <span>VIEW BACKEND PAYLOAD (MySQL ID: #{analysis.transaction_id || '27'})</span>
                </div>
                {showRawJson ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>

              {showRawJson && (
                <pre
                  style={{
                    marginTop: '0.75rem',
                    background: '#0d1117',
                    padding: '0.75rem',
                    borderRadius: 8,
                    fontSize: '0.72rem',
                    color: '#a5d6ff',
                    overflowX: 'auto',
                    maxHeight: 180,
                  }}
                >
                  {JSON.stringify(analysis, null, 2)}
                </pre>
              )}
            </div>
          )}

          {/* Re-open Modal button if user wants to see the editorial card again */}
          {!showHighInterventionModal && (
            <button
              onClick={() => setShowHighInterventionModal(true)}
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                color: '#cbd5e1',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: 14,
                padding: '0.75rem',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Show Warning Modal Again
            </button>
          )}

          {/* Actions from Detailed Review: Continue to Confirmation OR Cancel */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button
              className="primary-dark-action-btn"
              onClick={handleProceedToConfirmation}
            >
              <span>Continue to Confirmation</span>
              <ArrowRight size={18} />
            </button>
            <button
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                color: '#f87171',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: 14,
                padding: '0.85rem',
                fontSize: '0.9rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
              onClick={handleCancelPayment}
            >
              Cancel Payment (Safeguard)
            </button>
          </div>
        </div>

        {/* ===================================================================
            3. HIGH RISK INTERVENTION MODAL (Step 3 of Phase 6)
            Displayed initially. Primary: "Review Payment" | Secondary: "Cancel Payment"
            User MUST review payment before reaching confirmation!
            =================================================================== */}
        {showHighInterventionModal && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(26, 31, 38, 0.85)',
              backdropFilter: 'blur(3px)',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              zIndex: 100,
              padding: '1rem',
            }}
          >
            <div
              style={{
                background: '#edf0f4',
                borderRadius: 24,
                padding: '1.75rem 1.4rem',
                width: '100%',
                maxWidth: 420,
                boxShadow: '0 25px 60px -10px rgba(0, 0, 0, 0.5)',
                animation: 'slideUpModal 0.22s ease-out',
                color: '#0f172a',
              }}
            >
              {/* Icon & Title Row (Exact Stitch match to Screenshot 1) */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.85rem', marginBottom: '0.75rem' }}>
                <div
                  style={{
                    width: 42,
                    height: 42,
                    minWidth: 42,
                    borderRadius: 12,
                    background: '#fde8e4',
                    color: '#d93025',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginTop: 4,
                  }}
                >
                  <AlertTriangle size={24} strokeWidth={2.4} />
                </div>
                <div>
                  <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#b91c1c', letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: 2 }}>
                    Payment Risk Detected · HIGH RISK
                  </div>
                  <h1
                    style={{
                      fontFamily: 'var(--font-serif)',
                      fontSize: '1.75rem',
                      fontWeight: 700,
                      lineHeight: 1.15,
                      color: '#1e293b',
                    }}
                  >
                    This payment deserves another look
                  </h1>
                </div>
              </div>

              {/* Subtitle */}
              <p
                style={{
                  fontSize: '0.88rem',
                  color: '#475569',
                  lineHeight: 1.45,
                  marginBottom: '1.25rem',
                }}
              >
                We noticed some details that may be worth checking before you send money.
              </p>

              {/* 3 Gray Signal Cards (Screenshot 1 exact match) */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', marginBottom: '1.35rem' }}>
                <div
                  style={{
                    background: '#e2e8f0',
                    borderRadius: 14,
                    padding: '0.85rem 1rem',
                  }}
                >
                  <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#0f172a', marginBottom: 2 }}>
                    This amount is unusual for you
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#475569', lineHeight: 1.35 }}>
                    It differs from your typical payment pattern.
                  </div>
                </div>

                <div
                  style={{
                    background: '#e2e8f0',
                    borderRadius: 14,
                    padding: '0.85rem 1rem',
                  }}
                >
                  <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#0f172a', marginBottom: 2 }}>
                    This follows a return-money request
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#475569', lineHeight: 1.35 }}>
                    You were asked to send money back after a claimed transfer.
                  </div>
                </div>

                <div
                  style={{
                    background: '#e2e8f0',
                    borderRadius: 14,
                    padding: '0.85rem 1rem',
                  }}
                >
                  <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#0f172a', marginBottom: 2 }}>
                    The amounts don't match
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#475569', lineHeight: 1.35 }}>
                    The amount you're sending differs from the amount mentioned in the request.
                  </div>
                </div>
              </div>

              {/* Stacked Action Buttons: Back / Review Payment & Cancel */}
              <button
                onClick={handleContinueFromModal}
                style={{
                  width: '100%',
                  background: '#2b4255',
                  color: 'white',
                  borderRadius: 14,
                  padding: '0.95rem',
                  fontSize: '0.95rem',
                  fontWeight: 700,
                  border: 'none',
                  cursor: 'pointer',
                  marginBottom: '0.65rem',
                  transition: 'background 0.15s ease',
                }}
              >
                Review Payment
              </button>
              <button
                onClick={handleCancelPayment}
                style={{
                  width: '100%',
                  background: '#e2e8f0',
                  color: '#1e293b',
                  borderRadius: 14,
                  padding: '0.95rem',
                  fontSize: '0.95rem',
                  fontWeight: 700,
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'background 0.15s ease',
                }}
              >
                Cancel Payment
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
