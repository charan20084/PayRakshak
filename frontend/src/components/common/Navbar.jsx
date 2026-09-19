import React from 'react';
import { NavLink } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import ApiHealthBadge from './ApiHealthBadge';

export default function Navbar() {
  return (
    <header className="navbar">
      <NavLink to="/" className="nav-brand">
        <ShieldCheck size={28} color="#6366f1" />
        <span>PayRakshak</span>
      </NavLink>

      <nav className="nav-links">
        <NavLink
          to="/"
          className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          end
        >
          Home
        </NavLink>
        <NavLink
          to="/payment"
          className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
        >
          Simulate Payment
        </NavLink>
        <NavLink
          to="/risk-warning"
          className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
        >
          Risk Warning
        </NavLink>
        <NavLink
          to="/result"
          className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
        >
          Result
        </NavLink>
        <NavLink
          to="/history"
          className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
        >
          History
        </NavLink>
      </nav>

      <ApiHealthBadge />
    </header>
  );
}
