import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import HomePage from './pages/Home/HomePage';
import PaymentPage from './pages/Payment/PaymentPage';
import RiskWarningPage from './pages/RiskWarning/RiskWarningPage';
import ConfirmationPage from './pages/Confirmation/ConfirmationPage';
import ResultPage from './pages/Result/ResultPage';
import HistoryPage from './pages/History/HistoryPage';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/home" element={<HomePage />} />
      <Route path="/send" element={<PaymentPage />} />
      <Route path="/payment" element={<PaymentPage />} />
      <Route path="/review" element={<RiskWarningPage />} />
      <Route path="/risk-warning" element={<RiskWarningPage />} />
      <Route path="/confirm" element={<ConfirmationPage />} />
      <Route path="/confirmation" element={<ConfirmationPage />} />
      <Route path="/result" element={<ResultPage />} />
      <Route path="/history" element={<HistoryPage />} />
      <Route path="*" element={<Navigate to="/home" replace />} />
    </Routes>
  );
}
