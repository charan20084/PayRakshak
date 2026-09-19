import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  Wifi,
  Battery,
  Signal,
  RotateCw,
  Info,
  Shield,
  Home,
  Send,
  QrCode,
  BookOpen,
  ShieldCheck,
} from 'lucide-react';
import { checkHealth } from '../../services/api';

export default function MobileShell({ children, showHeader = true, showBottomNav = false, showStatusBar = false, showDisclaimer = false }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [apiOnline, setApiOnline] = useState(true);

  useEffect(() => {
    checkHealth()
      .then(() => setApiOnline(true))
      .catch(() => setApiOnline(false));
  }, [location.pathname]);

  return (
    <div className="device-viewport-wrapper">
      {/* Optional Top Status Bar */}
      {showStatusBar && (
        <div className="status-bar">
          <span>9:41</span>
          <div className="status-bar-icons">
            <Signal size={14} />
            <Wifi size={14} />
            <Battery size={16} />
          </div>
        </div>
      )}

      {/* Top Header (PayRakshak UPI) */}
      {showHeader && (
        <header className="app-header">
          <div className="header-brand" onClick={() => navigate('/home')} style={{ cursor: 'pointer' }}>
            <div className="brand-icon-box">P</div>
            <div className="brand-title-group">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.2rem', fontWeight: 700 }}>PayRakshak</h2>
                <span
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: '50%',
                    background: apiOnline ? '#10b981' : '#f59e0b',
                    boxShadow: apiOnline ? '0 0 6px #10b981' : 'none',
                    display: 'inline-block',
                  }}
                  title={apiOnline ? 'FastAPI Backend Connected' : 'Connecting to Backend...'}
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <span>UPI</span>
                <span style={{ color: '#94a3b8', fontSize: '0.65rem' }}>·</span>
                <span style={{ fontSize: '0.68rem', color: apiOnline ? '#059669' : '#d97706', fontWeight: 600 }}>
                  {apiOnline ? 'PROTECTED' : 'CONNECTING'}
                </span>
              </div>
            </div>
          </div>
          <div className="header-actions">
            <button
              className="header-icon-btn"
              title="Refresh / Sync"
              onClick={() => window.location.reload()}
            >
              <RotateCw size={15} />
            </button>
            <button
              className="header-icon-btn"
              title={apiOnline ? 'PayRakshak Engine: Online' : 'Connecting to Backend...'}
              onClick={() => {
                alert(
                  apiOnline
                    ? '🛡️ PayRakshak Engine Active\n\n• Backend: FastAPI (Port 8000)\n• Database: MySQL (payrakshak)\n• Heuristics: Phase 2 Deterministic Risk Engine\n• AI: Phase 3 Gemini Contextual Explanations'
                    : '⚠️ Connecting to FastAPI backend at http://localhost:8000...'
                );
              }}
            >
              <Info size={16} color={apiOnline ? '#059669' : '#64748b'} />
            </button>
          </div>
        </header>
      )}

      {/* 3. Main Viewport Scroll Content */}
      <div className="mobile-content-scroll">
        {children}
      </div>

      {/* 4. Bottom Tab Navigation Bar */}
      {showBottomNav && (
        <nav className="bottom-nav-bar">
          <NavLink to="/" className={({ isActive }) => `nav-tab-item ${isActive ? 'active' : ''}`}>
            <Home size={20} />
            <span>Home</span>
          </NavLink>
          <NavLink to="/payment" className={({ isActive }) => `nav-tab-item ${isActive ? 'active' : ''}`}>
            <Send size={20} />
            <span>Pay</span>
          </NavLink>
          <button
            className="nav-scan-floating-btn"
            title="Scan UPI QR"
            onClick={() => navigate('/payment')}
          >
            <QrCode size={22} />
          </button>
          <NavLink to="/history" className={({ isActive }) => `nav-tab-item ${isActive ? 'active' : ''}`}>
            <BookOpen size={20} />
            <span>Passbook</span>
          </NavLink>
          <button
            className="nav-tab-item"
            title="Sentinel Safety Engine"
            onClick={() => alert('PayRakshak Sentinel: Multi-signal heuristic risk engine and Gemini AI contextual scanner are active.')}
          >
            <div style={{ position: 'relative' }}>
              <Shield size={20} />
              <span
                style={{
                  position: 'absolute',
                  top: -2,
                  right: -3,
                  width: 7,
                  height: 7,
                  borderRadius: '50%',
                  backgroundColor: '#059669',
                  boxShadow: '0 0 6px #059669',
                }}
              />
            </div>
            <span>Sentinel</span>
          </button>
        </nav>
      )}

      {/* Optional Disclaimer Footer */}
      {showDisclaimer && (
        <div className="persistent-disclaimer-pill">
          DEMO ENVIRONMENT · SYNTHETIC DATA · NO REAL PAYMENTS
        </div>
      )}
    </div>
  );
}
