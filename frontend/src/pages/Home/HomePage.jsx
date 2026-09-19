import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  QrCode,
  Grid,
  History,
  ArrowUpRight,
  ArrowDownLeft,
  RotateCw,
  PlusCircle,
  X,
  CheckCircle2,
  Loader2,
  Wallet,
} from 'lucide-react';
import MobileShell from '../../components/layout/MobileShell';
import { getSimulatedBalance, resetSimulatedBalance, topUpSimulatedBalance } from '../../services/api';

export default function HomePage() {
  const navigate = useNavigate();
  const [balance, setBalance] = useState(200000.0);
  const [isResetting, setIsResetting] = useState(false);
  
  // Add Money Modal State
  const [isTopUpOpen, setIsTopUpOpen] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState('50000');
  const [isTopUpLoading, setIsTopUpLoading] = useState(false);
  const [topUpSuccessMsg, setTopUpSuccessMsg] = useState(null);

  const fetchBalance = () => {
    getSimulatedBalance()
      .then((res) => {
        if (res && typeof res.available_balance === 'number') {
          setBalance(res.available_balance);
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    fetchBalance();
  }, []);

  const handleResetDemoBalance = async (e) => {
    e?.stopPropagation();
    setIsResetting(true);
    try {
      const res = await resetSimulatedBalance();
      if (res && typeof res.available_balance === 'number') {
        setBalance(res.available_balance);
      }
    } catch {
      setBalance(200000.0);
    } finally {
      setTimeout(() => setIsResetting(false), 500);
    }
  };

  const handleTopUpSubmit = async (e) => {
    e.preventDefault();
    const val = parseFloat(topUpAmount);
    if (isNaN(val) || val <= 0) return;

    setIsTopUpLoading(true);
    try {
      const res = await topUpSimulatedBalance(val);
      if (res && typeof res.available_balance === 'number') {
        setBalance(res.available_balance);
      } else {
        setBalance((prev) => prev + val);
      }
      setTopUpSuccessMsg(`Successfully added ₹${val.toLocaleString('en-IN')} to demo account!`);
      setTimeout(() => {
        setTopUpSuccessMsg(null);
        setIsTopUpOpen(false);
      }, 1200);
    } catch {
      setBalance((prev) => prev + val);
      setTopUpSuccessMsg(`Added ₹${val.toLocaleString('en-IN')} (Offline demo mode)`);
      setTimeout(() => {
        setTopUpSuccessMsg(null);
        setIsTopUpOpen(false);
      }, 1200);
    } finally {
      setIsTopUpLoading(false);
    }
  };

  const presetAmounts = ['10000', '25000', '50000', '100000'];

  const frequentContacts = [
    { id: 'c1', initials: 'AR', name: 'Arjun', vpa: 'arjun@upi', color: 'teal', type: 'friend', avg: 800 },
    { id: 'c2', initials: 'PR', name: 'Priya', vpa: 'priya@upi', color: 'green', type: 'friend', avg: 400 },
    { id: 'c3', initials: 'CC', name: 'College ..', vpa: 'canteen@college', color: 'slate', type: 'merchant', avg: 150 },
    { id: 'c4', initials: 'FM', name: 'Fresh M..', vpa: 'freshmart@store', color: 'navy', type: 'merchant', avg: 1200 },
    { id: 'c5', initials: 'RA', name: 'Ravi', vpa: 'ravi@upi', color: 'teal', type: 'friend', avg: 500 },
  ];

  const recentTransactions = [
    { id: 't1', title: 'Canteen breakfast', sub: 'College Canteen · 18 Sept, 9:05 am', amount: -120, type: 'debit' },
    { id: 't2', title: 'Movie tickets split', sub: 'Arjun · 17 Sept, 8:40 pm', amount: -450, type: 'debit' },
    { id: 't3', title: 'Weekly groceries', sub: 'Fresh Mart · 17 Sept, 6:12 pm', amount: -1320, type: 'debit' },
    { id: 't4', title: 'Lunch share returned', sub: 'Priya · 17 Sept, 1:02 pm', amount: 300, type: 'credit' },
  ];

  const handleContactClick = (contact) => {
    navigate('/send', { state: { selectedContact: contact } });
  };

  return (
    <MobileShell showHeader={true} showBottomNav={false}>
      {/* 1. Account Total Balance Card */}
      <div className="stitch-card">
        <div className="balance-card-header">
          <div className="greeting-text">
            Good morning, <strong>Rahul Sharma</strong>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <button
              className="badge-available"
              onClick={() => setIsTopUpOpen(true)}
              title="Add simulated funds to account"
              style={{
                cursor: 'pointer',
                border: 'none',
                background: '#0d9488',
                color: '#ffffff',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                fontWeight: 600,
                padding: '3px 8px',
                borderRadius: '12px',
                fontSize: '0.68rem',
              }}
            >
              <PlusCircle size={12} />
              + ADD MONEY
            </button>
            <button
              className="badge-available"
              onClick={handleResetDemoBalance}
              title="Click to reset demo balance to ₹2,00,000"
              style={{
                cursor: 'pointer',
                border: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                transition: 'opacity 0.2s',
              }}
            >
              <RotateCw size={11} className={isResetting ? 'animate-spin' : ''} />
              RESET
            </button>
          </div>
        </div>

        <div className="balance-label">SIMULATED AVAILABLE BALANCE</div>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
          <div className="balance-amount">₹{balance.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</div>
        </div>
        <div className="account-subinfo">PayRakshak Demo Savings ··4471 · rahul@payrakshak</div>

        <div className="monthly-spend-tracker">
          <div className="monthly-spend-meta">
            <span>Simulation</span>
            <span>
              <strong>₹{balance.toLocaleString()}</strong> available
            </span>
          </div>
          <div className="spend-progress-bar">
            <div className="spend-progress-fill" style={{ width: `${Math.min(100, Math.max(10, (balance / 200000) * 100))}%` }} />
          </div>
        </div>
      </div>

      {/* 2. Quick Action Tiles (4-grid matching Stitch) */}
      <div className="action-tiles-grid">
        <div className="action-tile-btn" onClick={() => navigate('/send')}>
          <div className="action-circle-icon dark">
            <ArrowRight size={20} />
          </div>
          <span className="action-tile-label">Send</span>
        </div>

        <div className="action-tile-btn" onClick={() => navigate('/send')}>
          <div className="action-circle-icon blue">
            <QrCode size={20} />
          </div>
          <span className="action-tile-label">Scan</span>
        </div>

        <div className="action-tile-btn" onClick={() => navigate('/send')}>
          <div className="action-circle-icon coral">
            <Grid size={20} />
          </div>
          <span className="action-tile-label">Bills</span>
        </div>

        <div className="action-tile-btn" onClick={() => navigate('/history')}>
          <div className="action-circle-icon dark">
            <History size={20} />
          </div>
          <span className="action-tile-label">History</span>
        </div>
      </div>

      {/* 3. Frequent Contacts Row */}
      <div className="section-header-row">
        <div className="section-title">Frequent</div>
        <button className="section-action-link" onClick={() => navigate('/payment')}>
          See all
        </button>
      </div>

      <div className="frequent-contacts-scroll">
        {frequentContacts.map((c) => (
          <div
            key={c.id}
            className="contact-avatar-pill"
            onClick={() => handleContactClick(c)}
          >
            <div className={`contact-circle ${c.color}`}>{c.initials}</div>
            <span className="contact-name-label">{c.name}</span>
          </div>
        ))}
      </div>

      {/* 4. Recent Transactions List */}
      <div className="section-header-row" style={{ marginTop: '0.5rem' }}>
        <div className="section-title">Recent</div>
        <button className="section-action-link" onClick={() => navigate('/history')}>
          View all
        </button>
      </div>

      <div className="recent-transactions-card">
        {recentTransactions.map((tx) => (
          <div key={tx.id} className="tx-item-row">
            <div className="tx-left-group">
              <div className={`tx-icon-circle ${tx.type}`}>
                {tx.type === 'credit' ? (
                  <ArrowDownLeft size={18} />
                ) : (
                  <ArrowUpRight size={18} />
                )}
              </div>
              <div>
                <div className="tx-info-title">{tx.title}</div>
                <div className="tx-info-meta">{tx.sub}</div>
              </div>
            </div>
            <div className={`tx-amount-display ${tx.type}`}>
              {tx.amount < 0 ? `-₹${Math.abs(tx.amount)}` : `+₹${tx.amount}`}
            </div>
          </div>
        ))}
      </div>

      {/* 5. Add Money / Top-up Demo Balance Modal */}
      {isTopUpOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
            zIndex: 9999,
          }}
          onClick={() => !isTopUpLoading && setIsTopUpOpen(false)}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '430px',
              background: '#1e293b',
              borderTopLeftRadius: '24px',
              borderTopRightRadius: '24px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              padding: '1.5rem',
              color: '#ffffff',
              boxShadow: '0 -10px 25px rgba(0, 0, 0, 0.5)',
              animation: 'slideUp 0.25s ease-out',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: '10px',
                    background: 'rgba(13, 148, 136, 0.2)',
                    color: '#2dd4bf',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Wallet size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, fontFamily: 'var(--font-sans)' }}>
                    Add Demo Balance
                  </h3>
                  <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                    Simulated top-up for live presentation
                  </span>
                </div>
              </div>
              <button
                onClick={() => setIsTopUpOpen(false)}
                disabled={isTopUpLoading}
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: 'none',
                  color: '#94a3b8',
                  borderRadius: '50%',
                  width: 32,
                  height: 32,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Current Balance Meta */}
            <div
              style={{
                background: 'rgba(15, 23, 42, 0.6)',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                borderRadius: '12px',
                padding: '0.75rem 1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '1rem',
              }}
            >
              <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Current Available:</span>
              <span style={{ fontSize: '0.95rem', fontWeight: 700, color: '#38bdf8' }}>
                ₹{balance.toLocaleString('en-IN')}
              </span>
            </div>

            {/* Top-up Form */}
            <form onSubmit={handleTopUpSubmit}>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Enter Top-up Amount (₹)
              </label>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  background: '#0f172a',
                  borderRadius: '14px',
                  border: '1px solid #334155',
                  padding: '0.6rem 1rem',
                  marginBottom: '1rem',
                }}
              >
                <span style={{ fontSize: '1.4rem', fontWeight: 700, color: '#94a3b8', marginRight: '0.4rem' }}>₹</span>
                <input
                  type="number"
                  min="1"
                  step="100"
                  value={topUpAmount}
                  onChange={(e) => setTopUpAmount(e.target.value)}
                  placeholder="50000"
                  style={{
                    width: '100%',
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    color: '#ffffff',
                    fontSize: '1.3rem',
                    fontWeight: 700,
                    fontFamily: 'var(--font-sans)',
                  }}
                  required
                />
              </div>

              {/* Preset Chips */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem', marginBottom: '1.2rem' }}>
                {presetAmounts.map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setTopUpAmount(amt)}
                    style={{
                      background: topUpAmount === amt ? '#0d9488' : 'rgba(255, 255, 255, 0.06)',
                      border: topUpAmount === amt ? '1px solid #2dd4bf' : '1px solid rgba(255, 255, 255, 0.1)',
                      color: topUpAmount === amt ? '#ffffff' : '#cbd5e1',
                      borderRadius: '10px',
                      padding: '0.5rem 0.2rem',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                    }}
                  >
                    +₹{parseInt(amt) >= 100000 ? `${parseInt(amt) / 100000}L` : `${parseInt(amt) / 1000}k`}
                  </button>
                ))}
              </div>

              {/* Success Notification */}
              {topUpSuccessMsg && (
                <div
                  style={{
                    background: 'rgba(16, 185, 129, 0.15)',
                    border: '1px solid #10b981',
                    borderRadius: '10px',
                    padding: '0.6rem 0.8rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    color: '#6ee7b7',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    marginBottom: '1rem',
                  }}
                >
                  <CheckCircle2 size={16} />
                  <span>{topUpSuccessMsg}</span>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isTopUpLoading || !topUpAmount || parseFloat(topUpAmount) <= 0}
                style={{
                  width: '100%',
                  background: 'linear-gradient(135deg, #0d9488 0%, #0f766e 100%)',
                  border: 'none',
                  borderRadius: '14px',
                  padding: '0.9rem',
                  color: '#ffffff',
                  fontSize: '0.95rem',
                  fontWeight: 700,
                  cursor: isTopUpLoading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  boxShadow: '0 4px 14px rgba(13, 148, 136, 0.4)',
                  transition: 'opacity 0.2s',
                }}
              >
                {isTopUpLoading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Adding Funds...
                  </>
                ) : (
                  <>
                    <PlusCircle size={18} />
                    Deposit ₹{parseFloat(topUpAmount || 0).toLocaleString('en-IN')} to Demo Account
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </MobileShell>
  );
}
