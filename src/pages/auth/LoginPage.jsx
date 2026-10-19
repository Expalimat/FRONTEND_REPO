import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!username.trim() || !password) {
      setError('Please enter both username and password.');
      return;
    }

    setSubmitting(true);
    try {
      const user = await login(username, password);
      const roleRedirects = {
        Student: '/student/dashboard',
        Registrar: '/registrar/dashboard',
        Cashier: '/cashier/dashboard',
        'Department Staff': '/department/dashboard',
        Administrator: '/admin/dashboard'
      };
      navigate(roleRedirects[user.role] || '/student/dashboard');
    } catch (err) {
      setError(err.message || 'Login failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-vh-100 d-flex flex-column justify-content-center align-items-center bg-light p-3">
      <div className="w-100" style={{ maxWidth: '440px' }}>
        {/* Logo and System Header */}
        <div className="text-center mb-4">
          <div
            className="login-logo d-inline-flex align-items-center justify-content-center rounded-3 shadow-sm mb-3"
            style={{ width: '60px', height: '60px', fontSize: '1.75rem', fontWeight: 'bold' }}
          >
            PnC
          </div>
          <h3 className="fw-bold text-dark mb-1">PnC-OESS Portal</h3>
          <p className="text-muted small mb-0">
            Pamantasan ng Cabuyao Online Enrollment & Student Services
          </p>
        </div>

        {/* Main Login Card */}
        <div className="card login-card shadow-sm border-0 rounded-4 overflow-hidden">
          <div className="card-body p-4">
            <h5 className="card-title fw-bold text-dark mb-1">Sign In to Your Account</h5>
            <p className="text-muted small mb-4">Enter your credentials to access the portal</p>

            {error && (
              <div className="alert alert-danger d-flex align-items-center py-2 px-3 small rounded-3 mb-3" role="alert">
                <i className="bi bi-exclamation-octagon-fill me-2 fs-5"></i>
                <div>{error}</div>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label small fw-semibold text-dark">Username / ID Number</label>
                <div className="input-group">
                  <span className="input-group-text bg-light text-muted">
                    <i className="bi bi-person"></i>
                  </span>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Enter your username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    disabled={submitting}
                    required
                  />
                </div>
              </div>

              <div className="mb-3">
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <label className="form-label small fw-semibold text-dark mb-0">Password</label>
                </div>
                <div className="input-group">
                  <span className="input-group-text bg-light text-muted">
                    <i className="bi bi-lock"></i>
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="form-control"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={submitting}
                    required
                  />
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label="Toggle password visibility"
                  >
                    <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                  </button>
                </div>
              </div>

              <div className="d-flex justify-content-between align-items-center mb-4">
                <div className="form-check">
                  <input type="checkbox" className="form-check-input" id="rememberMe" defaultChecked />
                  <label className="form-check-label small text-muted" htmlFor="rememberMe">
                    Remember my device
                  </label>
                </div>
              </div>

              <button
                type="submit"
                className="btn login-submit w-100 py-2 fw-semibold d-flex align-items-center justify-content-center gap-2"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <span className="spinner-border spinner-border-sm" role="status"></span>
                    Authenticating...
                  </>
                ) : (
                  <>
                    Sign In
                    <i className="bi bi-arrow-right login-submit-icon"></i>
                  </>
                )}
              </button>
            </form>
          </div>

        </div>

        {/* Footer info */}
        <div className="text-center mt-4 text-muted small">
          <div>Pamantasan ng Cabuyao &bull; Official Student Portal</div>
          <div className="mt-1" style={{ fontSize: '0.72rem' }}>
            For technical inquiries, contact MIS Helpdesk at helpdesk@pnc.edu.ph
          </div>
        </div>
      </div>
    </div>
  );
};
