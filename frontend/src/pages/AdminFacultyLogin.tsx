import { useState } from 'react';
import { Lock, User, Eye, EyeOff, Loader2 } from 'lucide-react';
import '../styles.css';
import '../styles/auth-modern.css';
import { postJson, saveAuth } from '../utils/api';

type Props = {
  onBack?: () => void;
  onSuccess?: (role: string) => void;
};

const AdminFacultyLoginPage = ({ onBack, onSuccess }: Props) => {
  const [role, setRole] = useState<'Placement Head' | 'Faculty'>('Placement Head');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');

  const handleLogin = async () => {
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const expectedRole = role === 'Placement Head' ? 'PLACEMENT_HEAD' : 'FACULTY';
      const res = await postJson<{ token: string; role: string; email: string; name: string }>(
        '/api/auth/login',
        { email: username, password },
        false
      );
      if (res.data.role !== expectedRole) {
        throw new Error('Access denied for selected role');
      }
      saveAuth({ token: res.data.token, role: res.data.role, email: res.data.email, name: res.data.name });
      setSuccess(`Logged in as ${role}. Redirecting to ${role === 'Placement Head' ? 'Admin' : 'Faculty'} Dashboard...`);
      onSuccess?.(res.data.role);
    } catch (err: any) {
      setError(err.message || 'Invalid credentials. Please check your role, username, and password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-shell">
      <div className="login-card single fade-in">
        <div className="login-form">
          <div className="auth-header">
            <h2>Campus Placement Portal</h2>
            <p>Login to Continue</p>
          </div>

          <div className="auth-form">
            <div className="segmented">
              <button className={role === 'Placement Head' ? 'active' : ''} onClick={() => setRole('Placement Head')} type="button">Placement Head</button>
              <button className={role === 'Faculty' ? 'active' : ''} onClick={() => setRole('Faculty')} type="button">Faculty</button>
            </div>

            <label>
              Username
              <div className="input-wrap">
                <User size={16} />
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
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
                <input type="checkbox" /> Remember me
              </label>
              <span className="link-muted">Test mode only</span>
            </div>

            {error && <div className="auth-error">{error}</div>}
            {success && <div className="alert success">{success}</div>}

            <button className="primary-btn" onClick={handleLogin} disabled={loading}>
              {loading ? <Loader2 className="spinner" size={16} /> : `Login as ${role}`}
            </button>

            <button className="link-btn" onClick={onBack} style={{ justifyContent: 'flex-start' }}>
              Back to Home
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminFacultyLoginPage;
