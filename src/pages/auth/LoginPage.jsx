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
    <div className="login-page">
      <div className="login-shell">
        <section className="login-visual" aria-label="Pamantasan ng Cabuyao campus">
          <div className="login-visual-image" aria-hidden="true"></div>
          <div className="login-visual-overlay">
            <div className="login-pitch">
              <p>Pamantasan ng Cabuyao: affordable, quality education that shapes Cabuyeños to be world-ready and committed to serving their community.</p>
            </div>
          </div>
        </section>

        <section className="login-panel">
          <div className="login-panel-content">
            <div className="login-logo login-logo-panel d-inline-flex align-items-center justify-content-center rounded-3 shadow-sm">PnC</div>
            <div className="login-panel-heading">
              <span className="login-kicker">Pamantasan ng Cabuyao</span>
              <h2>Sign In to Your Account</h2>
              <p>Enter your credentials to access the portal.</p>
            </div>

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

              <div className="incoming-freshman-cta rounded-3 p-3 mb-4">
                <div className="fw-semibold text-dark">Incoming Freshman? Schedule Your Enrollment Appointment Here.</div>
                <div className="small text-muted mb-2">Not yet enrolled and don’t have a student account? Start here to schedule your enrollment appointment.</div>
                <button type="button" className="btn btn-link p-0 fw-semibold text-success" onClick={() => navigate('/incoming-freshman')}>
                  Start appointment <i className="bi bi-arrow-right ms-1" />
                </button>
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

          <div className="login-footer">
            <span>Pamantasan ng Cabuyao &bull; Official Student Portal</span>
            <span>For technical inquiries, contact MIS Helpdesk at helpdesk@pnc.edu.ph</span>
          </div>
        </section>
      </div>
    </div>
  );
};
