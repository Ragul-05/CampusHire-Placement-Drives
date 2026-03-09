import { useState } from 'react';
import { Lock, User, Eye, EyeOff, Loader2, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import '../styles.css';
import '../styles/auth-modern.css';
import { postJson, saveAuth } from '../utils/api';
import { ROUTES } from '../utils/routes';

type Props = {
  onBack?: () => void;
  onRegister?: () => void;
};

const StudentLoginPage = ({ onBack, onRegister }: Props) => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');

  const validateEmail = (value: string) => /[^@\s]+@[^@\s]+\.[^@\s]+/.test(value);

  const handleLogin = async () => {
    setError('');
    setSuccess('');
    if (!email || !password) {
      setError('Please fill in both email and password.');
      return;
    }
    if (!validateEmail(email)) {
      setError('Please enter a valid email address.');
      return;
    }
    setLoading(true);
    try {
      const res = await postJson<{ token: string; role: string; email: string; name: string }>(
        '/api/student/auth/login',
        { email, password }
      );
      if (res.data.role !== 'STUDENT') {
        throw new Error('Access denied: not a student account');
      }
      saveAuth({ token: res.data.token, role: res.data.role, email: res.data.email, name: res.data.name });
      navigate(ROUTES.studentDashboard, { replace: true });
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-shell">
      <div className="login-card single fade-in">
        <div className="login-form">
          <div className="auth-header">
            <h2>Student Login</h2>
            <p>Access your placement dashboard</p>
          </div>

          <div className="auth-form">
            <label>
              Email
              <div className="input-wrap">
                <User size={16} />
                <input
                  type="email"
                  placeholder="student@vcet.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </label>

            <label>
              Password
              <div className="input-wrap">
                <Lock size={16} />
                <input
                  type={showPass ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button className="icon-btn" onClick={() => setShowPass((s) => !s)} type="button">
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </label>

            <div className="auth-row">
              <label className="checkbox">
                <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} /> Remember me
              </label>
              <span className="link-muted">Use campus email</span>
            </div>

            {error && <div className="auth-error">{error}</div>}
            {success && <div className="alert success">{success}</div>}

            <button className="primary-btn" onClick={handleLogin} disabled={loading}>
              {loading ? <Loader2 className="spinner" size={16} /> : 'Login'}
            </button>

            <div className="auth-row">
              <button className="link-btn" onClick={onBack}><ArrowLeft size={14} /> Back</button>
              <button className="link-btn" onClick={onRegister}>Don’t have an account? Register</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentLoginPage;
