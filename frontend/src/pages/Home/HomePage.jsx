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
} from 'lucide-react';
import MobileShell from '../../components/layout/MobileShell';
import { getSimulatedBalance, resetSimulatedBalance } from '../../services/api';

export default function HomePage() {
  const navigate = useNavigate();
  const [balance, setBalance] = useState(200000.0);
  const [isResetting, setIsResetting] = useState(false);

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
    e.stopPropagation();
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
            DEMO BALANCE
          </button>
        </div>

        <div className="balance-label">SIMULATED AVAILABLE BALANCE</div>
        <div className="balance-amount">₹{balance.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</div>
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
    </MobileShell>
  );
}
