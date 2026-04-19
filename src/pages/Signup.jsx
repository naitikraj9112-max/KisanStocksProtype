import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signUp } from '../services/supabaseClient';
import { FiMail, FiLock, FiArrowRight, FiUserPlus } from 'react-icons/fi';
import { useLanguage } from '../utils/LanguageContext';
import Footer from '../components/Footer';

export default function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();
  const { t } = useLanguage();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);

    try {
      await signUp(email, password);
      setSuccess(true);
      // Redirect to dashboard after short delay
      setTimeout(() => navigate('/dashboard'), 1500);
    } catch (err) {
      setError(err.message || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-bg">
        <div className="auth-bg-pattern"></div>
      </div>

      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-logo">
            <div className="auth-logo-icon" style={{ background: 'transparent', boxShadow: 'none' }}>
              <img src="/kisanstocks-logo.svg" alt="KS" style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: '50%' }} />
            </div>
            <h1 className="auth-brand">{t('appName')}</h1>
          </div>

          <h2 className="auth-title">{t('createAccount')}</h2>
          <p className="auth-subtitle">{t('joinKisanStocks')}</p>

          {error && (
            <div className="auth-error">
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="auth-success">
              <span>Account created! Redirecting to dashboard...</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="auth-field">
              <label className="auth-label">{t('emailAddress')}</label>
              <div className="auth-input-wrapper">
                <FiMail className="auth-input-icon" size={16} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="auth-input"
                  required
                />
              </div>
            </div>

            <div className="auth-field">
              <label className="auth-label">{t('password')}</label>
              <div className="auth-input-wrapper">
                <FiLock className="auth-input-icon" size={16} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="auth-input"
                  required
                  minLength={6}
                />
              </div>
            </div>

            <div className="auth-field">
              <label className="auth-label">Confirm Password</label>
              <div className="auth-input-wrapper">
                <FiLock className="auth-input-icon" size={16} />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="auth-input"
                  required
                  minLength={6}
                />
              </div>
            </div>

            <button type="submit" className="auth-submit" disabled={loading}>
              {loading ? (
                <span className="submit-loading">
                  <span className="spinner"></span>
                  {t('signingUp')}
                </span>
              ) : (
                <>
                  <FiUserPlus size={16} /> {t('createAccount')}
                </>
              )}
            </button>
          </form>

          <p className="auth-switch">
            {t('alreadyHaveAccount')}{' '}
            <Link to="/login" className="auth-switch-link">
              {t('signInHere')}
            </Link>
          </p>
        </div>
      </div>
      <Footer />
    </div>
  );
}
