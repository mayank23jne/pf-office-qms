import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Lock, Eye, EyeOff } from 'lucide-react';
import { fetchApi } from '../api';

export const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');
      const res = await fetchApi('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password })
      });

      localStorage.setItem('token', res.token);
      localStorage.setItem('user', JSON.stringify(res.user));

      // Automatic Role Detection & Redirection
      const role = res.user.role;
      if (role === 'SUPER_ADMIN') {
        navigate('/super-admin');
      } else if (role === 'CITY_ADMIN' || role === 'ADMIN') {
        navigate('/admin');
      } else if (role === 'RECEPTION') {
        navigate('/reception');
      } else if (role === 'COUNTER') {
        navigate('/counter');
      } else {
        navigate('/display');
      }
    } catch (err: any) {
      setError(err.message || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '75vh', padding: '20px 0' }}>
      <div className="glass-panel animate-slide" style={{ width: '100%', maxWidth: '440px', padding: '38px 28px', border: '1px solid #cbd5e1' }}>
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div className="brand-logo-icon" style={{ margin: '0 auto 16px auto', width: '50px', height: '50px' }}>
            <Lock size={24} style={{ color: 'white' }} />
          </div>
          <h2 className="font-sora" style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0f172a' }}>PF Staff Portal Login</h2>
          <p style={{ color: '#475569', fontSize: '0.88rem', marginTop: '6px' }}>
            Enter your employee credentials to access your designated workspace. Role is detected automatically.
          </p>
        </div>

        {error && (
          <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', color: '#dc2626', padding: '12px', borderRadius: '8px', marginBottom: '20px', fontSize: '0.88rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: '#334155', marginBottom: '6px', fontWeight: 600 }}>
              Username / Email *
            </label>
            <input
              type="text"
              className="input-field"
              placeholder="e.g. admin, reception, counter1"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: '#334155', marginBottom: '6px', fontWeight: 600 }}>
              Password *
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                className="input-field"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ paddingRight: '40px' }}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#64748b',
                  display: 'flex',
                  alignItems: 'center',
                  padding: 0
                }}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button 
            type="submit" 
            className="btn-primary"
            disabled={loading}
            style={{ width: '100%', padding: '14px', fontSize: '1rem', fontWeight: 700, marginTop: '8px', background: '#0f2b5c' }}
          >
            {loading ? "Authenticating..." : "Login to Portal"} <ArrowRight size={18} />
          </button>
        </form>

        <div style={{ marginTop: '25px', paddingTop: '18px', borderTop: '1px solid #e2e8f0', textAlign: 'center', fontSize: '0.8rem', color: '#64748b' }}>
          Default Credentials:<strong>admin</strong> / <strong>admin123</strong> | <strong>reception</strong> / <strong>reception123</strong> | <strong>counter1</strong> / <strong>counter123</strong>
        </div>
      </div>
    </div>
  );
};
