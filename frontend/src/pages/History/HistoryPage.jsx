import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  RotateCw,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  X,
  Sparkles,
  Calendar,
  CreditCard,
  CheckCircle2,
  FileText,
} from 'lucide-react';
import MobileShell from '../../components/layout/MobileShell';
import { getSimulatedHistory } from '../../services/api';

export default function HistoryPage() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState('ALL'); // 'ALL' | 'LOW' | 'MEDIUM' | 'HIGH'
  const [historyItems, setHistoryItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTxn, setSelectedTxn] = useState(null);

  const fetchHistory = async (activeFilter) => {
    setIsLoading(true);
    try {
      const data = await getSimulatedHistory(activeFilter === 'ALL' ? undefined : activeFilter);
      if (Array.isArray(data)) {
        setHistoryItems(data);
      } else {
        setHistoryItems([]);
      }
    } catch {
      setHistoryItems([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory(filter);
  }, [filter]);

  const formatTxnDate = (dateString) => {
    if (!dateString) return 'Recent';
    try {
      const d = new Date(dateString);
      return d.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return String(dateString);
    }
  };

  const getRiskBadge = (level, score) => {
    const lvl = (level || 'LOW').toUpperCase();
    if (lvl === 'HIGH') {
      return {
        bg: '#fee2e2',
        color: '#b91c1c',
        border: '#fecaca',
        icon: <AlertTriangle size={12} />,
        label: `HIGH (${score !== undefined ? score.toFixed(0) : '85'}/100)`,
      };
    }
    if (lvl === 'MEDIUM') {
      return {
        bg: '#fef3c7',
        color: '#b45309',
        border: '#fde68a',
        icon: <ShieldAlert size={12} />,
        label: `MEDIUM (${score !== undefined ? score.toFixed(0) : '38'}/100)`,
      };
    }
    return {
      bg: '#e6f4ea',
      color: '#137333',
      border: '#bbf7d0',
      icon: <ShieldCheck size={12} />,
      label: `LOW (${score !== undefined ? score.toFixed(0) : '0'}/100)`,
    };
  };

  return (
    <MobileShell showHeader={false} showBottomNav={false}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.65rem 0 1rem' }}>
        <button className="header-icon-btn" onClick={() => navigate('/home')}>
          <ArrowLeft size={18} />
        </button>
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', lineHeight: 1.1 }}>
            Passbook
          </h2>
          <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>
            SIMULATED TRANSACTION AUDIT LOG
          </span>
        </div>
        <button className="header-icon-btn" onClick={() => fetchHistory(filter)}>
          <RotateCw size={15} />
        </button>
      </div>

      {/* 4 Filter Tabs: All, Low, Medium, High */}
      <div className="segmented-tab-control" style={{ marginBottom: '1rem' }}>
        <button
          className={`tab-control-btn ${filter === 'ALL' ? 'active' : ''}`}
          onClick={() => setFilter('ALL')}
        >
          All
        </button>
        <button
          className={`tab-control-btn ${filter === 'LOW' ? 'active' : ''}`}
          onClick={() => setFilter('LOW')}
        >
          Low
        </button>
        <button
          className={`tab-control-btn ${filter === 'MEDIUM' ? 'active' : ''}`}
          onClick={() => setFilter('MEDIUM')}
        >
          Medium
        </button>
        <button
          className={`tab-control-btn ${filter === 'HIGH' ? 'active' : ''}`}
          onClick={() => setFilter('HIGH')}
        >
          High
        </button>
      </div>

      {/* Transactions List */}
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '2.5rem 0', color: '#64748b', fontSize: '0.88rem' }}>
          Loading transaction audit log...
        </div>
      ) : historyItems.length === 0 ? (
        <div
          style={{
            background: 'white',
            borderRadius: 20,
            padding: '2.5rem 1.5rem',
            textAlign: 'center',
            color: '#64748b',
          }}
        >
          <CreditCard size={36} color="#94a3b8" style={{ margin: '0 auto 0.75rem' }} />
          <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#0f172a', marginBottom: 4 }}>
            No transactions found
          </div>
          <p style={{ fontSize: '0.8rem', color: '#64748b' }}>
            {filter === 'ALL'
              ? 'Complete a payment evaluation to see records here.'
              : `No transactions matching ${filter} risk level.`}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '2rem' }}>
          {historyItems.map((item) => {
            const badge = getRiskBadge(item.risk_level, item.risk_score);
            return (
              <div
                key={item.id || item.transaction_ref}
                onClick={() => setSelectedTxn(item)}
                style={{
                  background: 'white',
                  borderRadius: 18,
                  padding: '1rem 1.15rem',
                  boxShadow: '0 2px 10px rgba(15, 23, 42, 0.04)',
                  cursor: 'pointer',
                  border: '1px solid #f1f5f9',
                  transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                }}
              >
                {/* Card Top: Payee & Amount */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.4rem' }}>
                  <div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a' }}>
                      {item.payee_name || item.beneficiary}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                      {item.beneficiary}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', fontFamily: 'var(--font-serif)' }}>
                      ₹{parseFloat(item.amount).toLocaleString()}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                      {formatTxnDate(item.created_at)}
                    </div>
                  </div>
                </div>

                {/* Card Bottom: Risk Badge & Status */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.65rem', paddingTop: '0.5rem', borderTop: '1px solid #f8fafc' }}>
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.3rem',
                      background: badge.bg,
                      color: badge.color,
                      border: `1px solid ${badge.border}`,
                      padding: '0.15rem 0.55rem',
                      borderRadius: 999,
                      fontSize: '0.68rem',
                      fontWeight: 800,
                    }}
                  >
                    {badge.icon}
                    <span>{badge.label}</span>
                  </div>

                  <span style={{ fontSize: '0.72rem', fontWeight: 700, color: item.status?.includes('SAFEGUARD') ? '#b91c1c' : (item.status?.includes('WARN') ? '#b45309' : '#059669') }}>
                    {item.status || 'COMPLETED'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* =====================================================================
          6. TRANSACTION DETAILS MODAL
          Displays full persisted record from database
          ===================================================================== */}
      {selectedTxn && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'flex-end',
            zIndex: 100,
          }}
          onClick={() => setSelectedTxn(null)}
        >
          <div
            style={{
              background: 'white',
              width: '100%',
              maxWidth: 440,
              borderTopLeftRadius: 28,
              borderTopRightRadius: 28,
              padding: '1.5rem 1.4rem 2rem',
              boxShadow: '0 -10px 40px rgba(0, 0, 0, 0.25)',
              maxHeight: '90vh',
              overflowY: 'auto',
              animation: 'slideUpModal 0.2s ease-out',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>
                  Transaction Details
                </h3>
                <span style={{ fontSize: '0.74rem', color: '#64748b' }}>
                  REF: {selectedTxn.transaction_ref || `TXN${selectedTxn.id}`}
                </span>
              </div>
              <button
                style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                onClick={() => setSelectedTxn(null)}
              >
                <X size={16} color="#64748b" />
              </button>
            </div>

            {/* Recipient & Amount Summary */}
            <div className="stitch-card" style={{ marginBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <div>
                  <div className="balance-label">RECIPIENT</div>
                  <strong style={{ fontSize: '1rem', color: '#0f172a' }}>
                    {selectedTxn.payee_name || selectedTxn.beneficiary}
                  </strong>
                  <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                    {selectedTxn.beneficiary}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className="balance-label">AMOUNT</div>
                  <strong style={{ fontSize: '1.35rem', fontFamily: 'var(--font-serif)', color: '#0f172a' }}>
                    ₹{parseFloat(selectedTxn.amount).toLocaleString()}
                  </strong>
                </div>
              </div>

              {selectedTxn.context_note && (
                <div style={{ background: '#f8fafc', padding: '0.5rem 0.75rem', borderRadius: 8, fontSize: '0.8rem', color: '#475569', marginBottom: '0.65rem' }}>
                  <strong>Purpose:</strong> "{selectedTxn.context_note}"
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#64748b' }}>
                <span>Date & Time:</span>
                <span>{formatTxnDate(selectedTxn.created_at)}</span>
              </div>
            </div>

            {/* Risk Assessment Breakdown */}
            <div className="stitch-card" style={{ marginBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <span className="balance-label">RISK ENGINE EVALUATION</span>
                <span
                  style={{
                    background: (selectedTxn.risk_level || 'LOW').toUpperCase() === 'HIGH' ? '#fee2e2' : ((selectedTxn.risk_level || 'LOW').toUpperCase() === 'MEDIUM' ? '#fef3c7' : '#e6f4ea'),
                    color: (selectedTxn.risk_level || 'LOW').toUpperCase() === 'HIGH' ? '#b91c1c' : ((selectedTxn.risk_level || 'LOW').toUpperCase() === 'MEDIUM' ? '#b45309' : '#137333'),
                    padding: '0.2rem 0.6rem',
                    borderRadius: 999,
                    fontSize: '0.72rem',
                    fontWeight: 800,
                  }}
                >
                  {(selectedTxn.risk_level || 'LOW').toUpperCase()} RISK · {selectedTxn.risk_score !== undefined ? selectedTxn.risk_score.toFixed(0) : '0'}/100
                </span>
              </div>

              <div style={{ fontSize: '0.82rem', color: '#334155', lineHeight: 1.45, marginBottom: '0.85rem' }}>
                <strong>Explanation:</strong> {selectedTxn.explanation || 'Matches baseline transaction parameters.'}
              </div>

              {/* Detected Signals */}
              {selectedTxn.signals && selectedTxn.signals.length > 0 && (
                <div style={{ marginBottom: '0.75rem' }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: 4 }}>
                    Triggered Signals:
                  </div>
                  <ul style={{ paddingLeft: '1.25rem', fontSize: '0.78rem', color: '#b91c1c', lineHeight: 1.4 }}>
                    {selectedTxn.signals.map((sig, i) => (
                      <li key={i} style={{ marginBottom: 3 }}>{sig}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* AI Contextual Analysis (when available) */}
            {selectedTxn.ai_analysis && (
              <div className="stitch-card" style={{ marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.45rem' }}>
                  <Sparkles size={15} color="#2563eb" />
                  <span className="balance-label">GEMINI AI CONTEXTUAL APPRAISAL</span>
                </div>
                <p style={{ fontSize: '0.8rem', color: '#334155', lineHeight: 1.4, marginBottom: '0.65rem' }}>
                  {selectedTxn.ai_analysis.explanation || 'Standard contextual clearance.'}
                </p>
                {selectedTxn.ai_analysis.safety_checks?.length > 0 && (
                  <div>
                    <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', marginBottom: 2 }}>
                      Recommended Safety Checks:
                    </div>
                    <ul style={{ paddingLeft: '1.25rem', fontSize: '0.76rem', color: '#0f172a', lineHeight: 1.4 }}>
                      {selectedTxn.ai_analysis.safety_checks.map((chk, i) => (
                        <li key={i}>{chk}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Close Button */}
            <button
              className="primary-dark-action-btn"
              onClick={() => setSelectedTxn(null)}
            >
              Close Details
            </button>
          </div>
        </div>
      )}
    </MobileShell>
  );
}
