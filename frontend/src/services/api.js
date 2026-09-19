import axios from 'axios';

/**
 * Single centralized Axios client instance for frontend-to-backend communication.
 * Base URL defaults to empty string in development to leverage Vite's proxy,
 * falling back to VITE_API_BASE_URL or http://localhost:8000.
 */
const rawBaseURL = import.meta.env.VITE_API_BASE_URL || '';
const baseURL = typeof rawBaseURL === 'string' ? rawBaseURL.trim().replace(/\/+$/, '') : '';

export const apiClient = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

/**
 * Health check service
 * Connects to GET /health or /api/health
 * @returns {Promise<{status: string, service: string}>}
 */
export const checkHealth = async () => {
  try {
    const response = await apiClient.get('/health');
    return response.data;
  } catch (error) {
    // Retry on /api/health if /health is blocked by proxy rules
    try {
      const fallback = await apiClient.get('/api/health');
      return fallback.data;
    } catch {
      throw new Error('Security Engine is offline or unreachable.');
    }
  }
};

/**
 * Fetch simulated demo bank balance from backend
 * Connects to GET /api/payment/balance
 * @returns {Promise<{available_balance: number, currency: string, account_number: string, account_holder: string}>}
 */
export const getSimulatedBalance = async () => {
  try {
    const response = await apiClient.get('/api/payment/balance');
    return response.data;
  } catch {
    // Graceful fallback to initial ₹1,00,000 (1 Lakh) if backend is temporarily unreachable
    return {
      available_balance: 200000.0,
      currency: 'INR',
      account_number: '4471',
      account_holder: 'Rahul Sharma',
      is_demo: true,
    };
  }
};

/**
 * Perform simulated balance verification and deduction upon user confirmation
 * Connects to POST /api/payment/confirm
 * @param {{transaction_id?: number, amount: number}} confirmationData
 * @returns {Promise<{status: string, success: bool, message: string, amount: number, previous_balance: number, remaining_balance: number, deducted: bool}>}
 */
export const confirmSimulatedPayment = async (confirmationData) => {
  try {
    const response = await apiClient.post('/api/payment/confirm', {
      transaction_id: confirmationData.transaction_id || null,
      amount: parseFloat(confirmationData.amount),
    });
    return response.data;
  } catch (err) {
    if (err.response?.data) {
      return err.response.data;
    }
    throw new Error('Unable to confirm payment with simulated banking backend.');
  }
};

/**
 * Reset simulated demo balance back to starting ₹2,00,000.00 (2 Lakhs)
 * Connects to POST /api/payment/balance/reset
 * @returns {Promise<{available_balance: number}>}
 */
export const resetSimulatedBalance = async () => {
  try {
    const response = await apiClient.post('/api/payment/balance/reset');
    return response.data;
  } catch {
    return { available_balance: 200000.0 };
  }
};

/**
 * Add funds / Top-up simulated demo balance for presentation testing
 * Connects to POST /api/payment/balance/topup
 * @param {number} amount
 * @returns {Promise<{available_balance: number}>}
 */
export const topUpSimulatedBalance = async (amount) => {
  const topUpAmount = parseFloat(amount);
  if (isNaN(topUpAmount) || topUpAmount <= 0) {
    throw new Error('Please enter a valid top-up amount.');
  }
  try {
    const response = await apiClient.post('/api/payment/balance/topup', {
      amount: topUpAmount,
    });
    return response.data;
  } catch {
    return { available_balance: 200000.0 + topUpAmount };
  }
};

/**
 * Core APP Scam Payment Analysis Service
 * Communicates with FastAPI endpoint: POST /api/payment/analyze
 * 
 * Expected Backend Request Schema (PaymentAnalysisRequest):
 * - amount: float (> 0)
 * - beneficiary: str (min_length=1)
 * - new_beneficiary: bool
 * - new_device: bool
 * - transactions_last_10_min: int (>= 0)
 * - previous_average: float (>= 0.0)
 * - location_changed: bool
 * - unusual_time: bool
 * - context_note: Optional[str]
 * 
 * Expected Backend Response Schema (PaymentAnalysisResponse):
 * - transaction_id: int
 * - amount: float
 * - beneficiary: str
 * - risk_score: float (0.0 to 100.0)
 * - risk_level: 'LOW' | 'MEDIUM' | 'HIGH'
 * - signals: string[]
 * - explanation: string
 * - recommended_action: 'ALLOW' | 'WARN' | 'INTERVENE'
 * - ai_analysis: { available: bool, contextual_risk: string, app_indicators: string[], explanation: string, safety_checks: string[] }
 * - created_at: string
 * 
 * @param {Object} paymentData
 * @returns {Promise<PaymentAnalysisResponse>}
 */
export const analyzePayment = async (paymentData) => {
  // 1. Client-side input sanity check before sending
  const amount = parseFloat(paymentData.amount);
  if (isNaN(amount) || amount <= 0) {
    throw new Error('Please enter a valid transfer amount greater than zero.');
  }

  const beneficiary = (paymentData.beneficiary || '').trim();
  if (!beneficiary) {
    throw new Error('Beneficiary UPI ID or recipient identifier is required.');
  }

  // 2. Format payload strictly to Pydantic PaymentAnalysisRequest
  const payload = {
    amount: amount,
    beneficiary: beneficiary,
    new_beneficiary: Boolean(paymentData.new_beneficiary),
    new_device: Boolean(paymentData.new_device),
    transactions_last_10_min: Math.max(0, parseInt(paymentData.transactions_last_10_min) || 0),
    previous_average: Math.max(0.0, parseFloat(paymentData.previous_average) || 0.0),
    location_changed: Boolean(paymentData.location_changed),
    unusual_time: Boolean(paymentData.unusual_time),
    context_note: paymentData.context_note ? String(paymentData.context_note).trim() : null,
  };

  try {
    const response = await apiClient.post('/api/payment/analyze', payload);
    return response.data;
  } catch (err) {
    if (err.response) {
      // Server responded with an error status (4xx, 5xx)
      const detail = err.response.data?.detail || err.response.statusText;
      const cleanMessage = typeof detail === 'string' ? detail : 'Payment evaluation failed on the security server.';
      const customError = new Error(cleanMessage);
      customError.status = err.response.status;
      throw customError;
    } else if (err.code === 'ECONNABORTED') {
      throw new Error('Security evaluation request timed out. Please try again.');
    } else {
      // Network error or server not running
      throw new Error('Unable to reach security verification engine. Please verify the backend is active.');
    }
  }
};

/**
 * Fetch simulated history from backend with optional risk level filter
 * @param {string} [riskLevel] - Optional: 'LOW' | 'MEDIUM' | 'HIGH'
 * @returns {Promise<Array>}
 */
export const getSimulatedHistory = async (riskLevel) => {
  try {
    const params = riskLevel && riskLevel !== 'ALL' ? { risk_level: riskLevel } : {};
    const response = await apiClient.get('/api/history', { params });
    return response.data;
  } catch {
    return [];
  }
};

export default apiClient;
