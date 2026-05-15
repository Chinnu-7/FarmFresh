import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import client, { setToken } from '../api';

export default function LoginPage() {
  const [phone, setPhone] = useState('9999999999');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState('phone'); // 'phone' | 'otp'
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await client.post('/auth/send-otp', { phone });
      setStep('otp');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await client.post('/auth/verify-otp', { phone, otp });
      const { role, token } = res.data.data;

      if (role !== 'admin') {
        setError('Access denied. Admin accounts only.');
        return;
      }

      setToken(token);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <h1>🥛 PureDudh</h1>
        <p className="subtitle">Admin Dashboard Login</p>

        {error && (
          <div style={{ background: '#FFEBEE', color: '#C62828', padding: '10px 14px', borderRadius: 8, marginBottom: 20, fontSize: 13, fontWeight: 600 }}>
            {error}
          </div>
        )}

        {step === 'phone' ? (
          <form onSubmit={handleSendOtp}>
            <div className="form-group">
              <label>Admin Phone Number</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Enter admin phone"
                maxLength={10}
                required
              />
            </div>
            <button className="btn btn-primary" type="submit" disabled={loading}>
              {loading ? 'Sending...' : 'Get OTP'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerify}>
            <div className="form-group">
              <label>OTP sent to +91 {phone}</label>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="Enter 6-digit OTP"
                maxLength={6}
                required
                autoFocus
                style={{ textAlign: 'center', letterSpacing: 8, fontSize: 20, fontWeight: 700 }}
              />
            </div>
            <button className="btn btn-primary" type="submit" disabled={loading}>
              {loading ? 'Verifying...' : 'Login'}
            </button>
            <p style={{ textAlign: 'center', marginTop: 16, fontSize: 13, color: '#999' }}>
              <span style={{ cursor: 'pointer', color: '#1B5E20' }} onClick={() => setStep('phone')}>
                ← Change number
              </span>
            </p>
          </form>
        )}

        <p style={{ textAlign: 'center', marginTop: 24, fontSize: 11, color: '#bbb' }}>
          Dev OTP: 123456 • Admin phone: 9999999999
        </p>
      </div>
    </div>
  );
}
