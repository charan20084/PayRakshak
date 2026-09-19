import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  ArrowLeft,
  RotateCw,
  XCircle,
  Search,
  Check,
  ArrowRight,
  ShieldAlert,
  Loader2,
  X,
  Sliders,
  ChevronDown,
  ChevronUp,
  AlertCircle,
} from 'lucide-react';
import MobileShell from '../../components/layout/MobileShell';
import { analyzePayment, getSimulatedBalance } from '../../services/api';

const ALL_CONTACTS = [
  { id: '1', name: 'Arjun', vpa: 'arjun@upi', badge: 'Friend', initials: 'AR', color: '#1e5a52', defaultAmount: '8000', defaultNote: 'I sent you ₹5,000. Please return ₹8,000 to arjun@upi.', avg: 800 },
  { id: '2', name: 'Priya', vpa: 'priya@upi', badge: 'Friend', initials: 'PR', color: '#1b4d3e', defaultAmount: '300', defaultNote: 'Lunch share returned', avg: 400 },
  { id: '3', name: 'College Canteen', vpa: 'canteen@upi', badge: 'Merchant', initials: 'CC', color: '#3e5c76', defaultAmount: '120', defaultNote: 'Breakfast', avg: 150 },
  { id: '4', name: 'Ravi', vpa: 'ravi@upi', badge: 'Friend', initials: 'RA', color: '#1e5a52', defaultAmount: '500', defaultNote: 'Movie tickets', avg: 500 },
  { id: '5', name: 'Fresh Mart', vpa: 'freshmart@upi', badge: 'Merchant', initials: 'FM', color: '#18283b', defaultAmount: '1320', defaultNote: 'Weekly groceries', avg: 1200 },
  { id: '6', name: 'Electricity Board', vpa: 'electricity@upi', badge: 'Biller', initials: 'EB', color: '#3b4d61', defaultAmount: '2450', defaultNote: 'Monthly bill', avg: 2200 },
  { id: '7', name: 'Kiran', vpa: 'kiran@upi', badge: 'Occasional', initials: 'KI', color: '#b86259', defaultAmount: '1500', defaultNote: 'Book borrow', avg: 1000 },
  { id: '8', name: 'Unknown User', vpa: 'unknown.person@upi', badge: 'Not in your contacts', initials: 'UU', color: '#2d3748', defaultAmount: '12000', defaultNote: 'Lottery registration fee', avg: 0 },
  { id: '9', name: 'Refund Help', vpa: 'refund.help@upi', badge: 'Not in your contacts', initials: 'RH', color: '#1e5a52', defaultAmount: '25000', defaultNote: 'Urgent customs refund release', avg: 0 },
  { id: '10', name: 'Verification Desk', vpa: 'verification@upi', badge: 'Not in your contacts', initials: 'VD', color: '#334155', defaultAmount: '50000', defaultNote: 'Bank security deposit', avg: 0 },
  { id: '11', name: 'Luxury Jewelry Vault', vpa: 'luxury.vault@upi', badge: 'High Value Demo', initials: 'LV', color: '#854d0e', defaultAmount: '220000', defaultNote: 'Precious metal token purchase', avg: 5000 },
];

export default function PaymentPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const [activeTab, setActiveTab] = useState('contact'); // 'contact' | 'upi'
  const [searchQuery, setSearchQuery] = useState('');
  
  // Selected contact & payment parameters
  const [selectedContact, setSelectedContact] = useState(null);
  const [customVpa, setCustomVpa] = useState('');
  const [amount, setAmount] = useState('8000');
  const [note, setNote] = useState('I sent you ₹5,000. Please return ₹8,000 to arjun@upi.');
  
  // Advanced Simulation Signals (Connected to FastAPI Risk Engine)
  const [showAdvancedSignals, setShowAdvancedSignals] = useState(false);
  const [newDevice, setNewDevice] = useState(false);
  const [velocity, setVelocity] = useState(0);
  const [previousAvg, setPreviousAvg] = useState(800.0);
  const [locationChanged, setLocationChanged] = useState(false);
  const [unusualTime, setUnusualTime] = useState(false);

  // Drawer / Analysis state
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState(1);
  const [demoBalance, setDemoBalance] = useState(200000.0);
  const [errorMessage, setErrorMessage] = useState(null);

  useEffect(() => {
    getSimulatedBalance()
      .then((res) => {
        if (res && typeof res.available_balance === 'number') {
          setDemoBalance(res.available_balance);
        }
      })
      .catch(() => {});
  }, []);

  // Quick Preset Handlers (Scenarios A, B, C for Phase 5 verification)
  const applyPresetScenario = (scenario) => {
    setErrorMessage(null);
    if (scenario === 'normal') {
      // Scenario A: Normal/saved beneficiary, normal amount -> LOW (ALLOW)
      const arjun = ALL_CONTACTS[0];
      setSelectedContact(arjun);
      setAmount('500');
      setNote('Dinner split');
      setPreviousAvg(800.0);
      setNewDevice(false);
      setVelocity(0);
      setLocationChanged(false);
      setUnusualTime(false);
      setIsSheetOpen(true);
    } else if (scenario === 'suspicious') {
      // Scenario B: New beneficiary, amount significantly above normal -> MEDIUM (WARN)
      setSelectedContact({
        id: 'deals',
        name: 'Flash Deals Outlet',
        vpa: 'flash.deals@paytm',
        badge: 'Not in your contacts',
        initials: 'FD',
        color: '#b86259',
        avg: 1800.0,
      });
      setAmount('6500');
      setNote('Promotional discount purchase');
      setPreviousAvg(1800.0);
      setNewDevice(false);
      setVelocity(0);
      setLocationChanged(false);
      setUnusualTime(false);
      setIsSheetOpen(true);
    } else {
      // Scenario C: New beneficiary, very unusual amount, new device, rapid activity -> HIGH (INTERVENE)
      const refundHelp = ALL_CONTACTS[8];
      setSelectedContact(refundHelp);
      setAmount('80000');
      setNote('Urgent customs refund release');
      setPreviousAvg(2500.0);
      setNewDevice(true);
      setVelocity(4);
      setLocationChanged(false);
      setUnusualTime(false);
      setIsSheetOpen(true);
    }
  };

  useEffect(() => {
    if (location.state?.selectedContact) {
      const match = ALL_CONTACTS.find(c => c.vpa === location.state.selectedContact.vpa) || {
        id: 'sel',
        name: location.state.selectedContact.name,
        vpa: location.state.selectedContact.vpa,
        badge: 'Friend',
        initials: location.state.selectedContact.initials || 'US',
        color: '#1e5a52',
        defaultAmount: '8000',
        defaultNote: 'Payment transfer',
        avg: 800,
      };
      openPaymentSheet(match);
    } else if (location.state?.scenario === 'scam') {
      applyPresetScenario('scam');
    }
  }, [location.state]);

  const openPaymentSheet = (contact) => {
    setErrorMessage(null);
    setSelectedContact(contact);
    setAmount(contact.defaultAmount || '8000');
    setNote(contact.defaultNote || 'Payment transfer');
    setPreviousAvg(contact.avg || 800.0);
    setIsSheetOpen(true);
  };

  const handleReviewPayment = async () => {
    setErrorMessage(null);

    // 1. Client-side input validation
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setErrorMessage('Please enter a valid transfer amount greater than 0.');
      return;
    }

    const recipientVpa = selectedContact ? selectedContact.vpa : (customVpa || '').trim();
    if (!recipientVpa) {
      setErrorMessage('Please specify a valid beneficiary UPI ID or contact.');
      return;
    }

    const isNew = selectedContact ? selectedContact.badge === 'Not in your contacts' : true;

    // 2. Build payload matching FastAPI Pydantic schema
    const payload = {
      amount: parsedAmount,
      beneficiary: recipientVpa,
      new_beneficiary: isNew,
      new_device: newDevice,
      transactions_last_10_min: velocity,
      previous_average: previousAvg,
      location_changed: locationChanged,
      unusual_time: unusualTime,
      context_note: note ? note.trim() : null,
    };

    // 3. Initiate analysis loading state
    setIsAnalyzing(true);
    setAnalysisStep(1);

    const stepTimer = setTimeout(() => {
      setAnalysisStep(2);
    }, 450);

    try {
      // 4. Send real HTTP request to FastAPI backend
      const result = await analyzePayment(payload);

      clearTimeout(stepTimer);
      setIsAnalyzing(false);

      // 5. Navigate to /review with real backend assessment
      navigate('/review', {
        state: {
          analysis: result,
          recipient: selectedContact || {
            name: recipientVpa.split('@')[0] || 'Unknown',
            vpa: recipientVpa,
            badge: isNew ? 'Not in your contacts' : 'Friend',
            initials: (recipientVpa.slice(0, 2) || 'UP').toUpperCase(),
            color: '#1e293b',
          },
          amount: parsedAmount,
          note: note,
          previousAvg: previousAvg,
        },
      });
    } catch (err) {
      clearTimeout(stepTimer);
      setIsAnalyzing(false);
      console.error('[PayRakshak] Payment analysis API error:', err);
      setErrorMessage(
        err.message || 'Unable to complete security analysis. Please verify your connection.'
      );
    }
  };

  const filteredContacts = ALL_CONTACTS.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.vpa.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <MobileShell showHeader={false} showBottomNav={false}>
      {/* 1. Send Money Screen Header (Exact match to Screenshot 2) */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.65rem 0 1rem' }}>
        <button className="header-icon-btn" onClick={() => navigate('/home')}>
          <ArrowLeft size={18} />
        </button>
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', lineHeight: 1.1 }}>
            Send money
          </h2>
          <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>UPI</span>
        </div>
        <div style={{ display: 'flex', gap: '0.4rem' }}>
          <button className="header-icon-btn" onClick={() => window.location.reload()}>
            <RotateCw size={15} />
          </button>
          <button className="header-icon-btn" onClick={() => navigate('/home')}>
            <XCircle size={17} color="#475569" />
          </button>
        </div>
      </div>

      {/* Quick Scenario Testing Bar for Live Backend Evaluation */}
      <div
        style={{
          display: 'flex',
          gap: '0.45rem',
          overflowX: 'auto',
          paddingBottom: '0.6rem',
          marginBottom: '0.5rem',
          scrollbarWidth: 'none',
        }}
      >
        <button
          onClick={() => applyPresetScenario('normal')}
          style={{
            background: '#e6f4ea',
            color: '#137333',
            border: '1px solid #bbf7d0',
            borderRadius: 999,
            padding: '0.35rem 0.75rem',
            fontSize: '0.74rem',
            fontWeight: 700,
            whiteSpace: 'nowrap',
            cursor: 'pointer',
          }}
        >
          🟢 Normal: Arjun (₹500)
        </button>
        <button
          onClick={() => applyPresetScenario('suspicious')}
          style={{
            background: '#fef3c7',
            color: '#b45309',
            border: '1px solid #fde68a',
            borderRadius: 999,
            padding: '0.35rem 0.75rem',
            fontSize: '0.74rem',
            fontWeight: 700,
            whiteSpace: 'nowrap',
            cursor: 'pointer',
          }}
        >
          🟡 Suspicious: Deals (₹6.5k)
        </button>
        <button
          onClick={() => applyPresetScenario('scam')}
          style={{
            background: '#fee2e2',
            color: '#b91c1c',
            border: '1px solid #fecaca',
            borderRadius: 999,
            padding: '0.35rem 0.75rem',
            fontSize: '0.74rem',
            fontWeight: 700,
            whiteSpace: 'nowrap',
            cursor: 'pointer',
          }}
        >
          🔴 APP Scam: Refund (₹80k)
        </button>
      </div>

      {/* 2. Segmented Tab Switcher (Select contact / Enter UPI ID) */}
      <div className="segmented-tab-control">
        <button
          className={`tab-control-btn ${activeTab === 'contact' ? 'active' : ''}`}
          onClick={() => setActiveTab('contact')}
        >
          Select contact
        </button>
        <button
          className={`tab-control-btn ${activeTab === 'upi' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('upi');
            setSelectedContact(null);
            setIsSheetOpen(true);
          }}
        >
          Enter UPI ID
        </button>
      </div>

      {/* 3. Search / Input Box */}
      <div className="search-input-pill">
        <Search size={18} color="#94a3b8" />
        <input
          type="text"
          placeholder="Search name or UPI ID"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* 4. Full Contacts List (Screenshot 2 exact match) */}
      {activeTab === 'contact' && (
        <div className="contacts-full-list-card">
          {filteredContacts.map((contact) => (
            <div
              key={contact.id}
              className="contact-row-item"
              onClick={() => openPaymentSheet(contact)}
            >
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div
                  className="contact-circle"
                  style={{
                    width: 44,
                    height: 44,
                    background: contact.color,
                    marginRight: '0.9rem',
                    fontSize: '0.88rem',
                  }}
                >
                  {contact.initials}
                </div>
                <div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a' }}>
                    {contact.name}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: 1 }}>
                    {contact.vpa}
                  </div>
                </div>
              </div>
              <div className="contact-badge-pill">
                {contact.badge}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Payment Entry Drawer / Sheet with Live Backend Simulation Parameters */}
      {isSheetOpen && (
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
          onClick={() => {
            if (!isAnalyzing) setIsSheetOpen(false);
          }}
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
            {/* Sheet Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div
                  className="contact-circle"
                  style={{
                    width: 42,
                    height: 42,
                    background: selectedContact?.color || '#1e293b',
                  }}
                >
                  {selectedContact?.initials || 'UP'}
                </div>
                <div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a' }}>
                    {selectedContact?.name || 'Enter UPI ID'}
                  </h3>
                  <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                    {selectedContact?.vpa || 'Direct transfer'}
                  </span>
                </div>
              </div>
              <button
                style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                onClick={() => {
                  if (!isAnalyzing) setIsSheetOpen(false);
                }}
              >
                <X size={16} color="#64748b" />
              </button>
            </div>

            {/* Error Banner */}
            {errorMessage && (
              <div
                style={{
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: 12,
                  padding: '0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  color: '#b91c1c',
                  fontSize: '0.82rem',
                  marginBottom: '1rem',
                }}
              >
                <AlertCircle size={16} style={{ flexShrink: 0 }} />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* If custom UPI ID */}
            {!selectedContact && (
              <div style={{ marginBottom: '1rem' }}>
                <div className="balance-label">RECIPIENT UPI ID</div>
                <input
                  type="text"
                  placeholder="e.g. merchant@upi"
                  value={customVpa}
                  onChange={(e) => setCustomVpa(e.target.value)}
                  style={{
                    width: '100%',
                    background: '#f8fafc',
                    border: '1px solid #cbd5e1',
                    borderRadius: 12,
                    padding: '0.75rem 1rem',
                    fontSize: '0.92rem',
                    outline: 'none',
                  }}
                />
              </div>
            )}

            {/* Amount Input */}
            <div className="balance-label">AMOUNT TO SEND</div>
            <div style={{ display: 'flex', alignItems: 'center', margin: '0.25rem 0 0.5rem' }}>
              <span style={{ fontFamily: 'var(--font-serif)', fontSize: '2.5rem', fontWeight: 700, color: '#0f172a', marginRight: 4 }}>
                ₹
              </span>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                style={{
                  fontFamily: 'var(--font-serif)',
                  fontSize: '2.5rem',
                  fontWeight: 700,
                  color: '#0f172a',
                  border: 'none',
                  outline: 'none',
                  width: '100%',
                  background: 'transparent',
                }}
              />
            </div>

            <div className="account-subinfo" style={{ marginBottom: '1rem' }}>
              Available demo balance <strong>₹{demoBalance.toLocaleString()}</strong>
            </div>

            {/* Quick Amount Chips */}
            <div className="quick-amount-chips" style={{ marginBottom: '1rem' }}>
              {['500', '1000', '2000', '5000', '8000'].map((chip) => (
                <button
                  key={chip}
                  className={`chip-btn ${amount === chip ? 'active' : ''}`}
                  onClick={() => setAmount(chip)}
                >
                  ₹{parseInt(chip).toLocaleString()}
                </button>
              ))}
            </div>

            {/* Context Note Input */}
            <div style={{ marginBottom: '1rem' }}>
              <div className="balance-label" style={{ marginBottom: '0.35rem' }}>
                NOTE (CONTEXT FOR RISK ASSESSMENT)
              </div>
              <textarea
                rows={2}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="What is this payment for? (e.g. Return money, split, refund)"
                style={{
                  width: '100%',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: 12,
                  padding: '0.65rem 0.85rem',
                  fontSize: '0.85rem',
                  color: '#0f172a',
                  outline: 'none',
                  resize: 'none',
                  fontFamily: 'inherit',
                }}
              />
            </div>

            {/* Advanced Behavioral Signals Drawer (Connected to FastAPI) */}
            <div style={{ marginBottom: '1.25rem', borderTop: '1px solid #f1f5f9', paddingTop: '0.75rem' }}>
              <button
                type="button"
                onClick={() => setShowAdvancedSignals(!showAdvancedSignals)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  width: '100%',
                  background: 'none',
                  border: 'none',
                  color: '#475569',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  padding: '0.25rem 0',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Sliders size={14} />
                  <span>BEHAVIORAL ENGINE PARAMETERS</span>
                </div>
                {showAdvancedSignals ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>

              {showAdvancedSignals && (
                <div style={{ marginTop: '0.75rem', background: '#f8fafc', borderRadius: 12, padding: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8rem', color: '#334155' }}>
                    <span>Unrecognised Device</span>
                    <input type="checkbox" checked={newDevice} onChange={(e) => setNewDevice(e.target.checked)} />
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8rem', color: '#334155' }}>
                    <span>Rapid Velocity (Txns last 10m)</span>
                    <select
                      value={velocity}
                      onChange={(e) => setVelocity(parseInt(e.target.value))}
                      style={{ background: 'white', border: '1px solid #cbd5e1', borderRadius: 6, padding: '2px 8px', fontSize: '0.8rem' }}
                    >
                      <option value={0}>0 txns</option>
                      <option value={2}>2 txns (+14 pts)</option>
                      <option value={4}>4+ txns (+25 pts)</option>
                    </select>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8rem', color: '#334155' }}>
                    <span>Historical Average Baseline</span>
                    <span style={{ fontWeight: 600 }}>₹{previousAvg.toLocaleString()}</span>
                  </label>
                  <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: 2 }}>
                    📡 Connected to FastAPI at <code>POST /api/payment/analyze</code>
                  </div>
                </div>
              )}
            </div>

            {/* Primary Action Button: "Analyze Payment" */}
            <button
              className="primary-dark-action-btn"
              disabled={isAnalyzing}
              onClick={handleReviewPayment}
            >
              {isAnalyzing ? (
                <>
                  <Loader2 size={18} className="spin-animation" />
                  <span>Analyzing payment...</span>
                </>
              ) : (
                <>
                  <span>Analyze payment</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Full Screen Scanning Modal */}
      {isAnalyzing && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.85)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 200,
            padding: '2rem',
            textAlign: 'center',
            color: 'white',
          }}
        >
          <div
            style={{
              width: 70,
              height: 70,
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1.25rem',
              border: '2px solid rgba(255, 255, 255, 0.2)',
            }}
          >
            <ShieldAlert size={36} color="#fbbf24" />
          </div>
          <h3 style={{ fontSize: '1.35rem', fontWeight: 700, marginBottom: '0.5rem' }}>
            Analyzing payment...
          </h3>
          <p style={{ fontSize: '0.88rem', color: '#cbd5e1', maxWidth: 280, lineHeight: 1.4 }}>
            {analysisStep === 1
              ? 'Analyzing payment...'
              : 'Checking behavioural and contextual signals...'}
          </p>
        </div>
      )}
    </MobileShell>
  );
}
