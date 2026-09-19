import React, { useState, useEffect } from 'react';
import { checkHealth } from '../../services/api';
import { Activity, CheckCircle2, AlertCircle } from 'lucide-react';

export default function ApiHealthBadge() {
  const [health, setHealth] = useState({ status: 'checking', service: '' });
  const [error, setError] = useState(null);

  const fetchHealth = async () => {
    try {
      const data = await checkHealth();
      setHealth(data);
      setError(null);
    } catch (err) {
      setError(err.message || 'API unreachable');
      setHealth({ status: 'offline', service: 'AREA51 API' });
    }
  };

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 15000);
    return () => clearInterval(interval);
  }, []);

  const isConnected = health.status === 'ok';

  return (
    <div
      id="api-health-badge"
      className={`health-badge ${isConnected ? 'connected' : 'disconnected'}`}
      title={error ? `Error: ${error}` : `Connected to ${health.service || 'Backend'}`}
    >
      <span className={`health-dot ${isConnected ? 'green' : 'red'}`} />
      <span>{isConnected ? `${health.service}: Online` : 'Backend API: Offline'}</span>
    </div>
  );
}
