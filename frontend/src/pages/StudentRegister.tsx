import { useState } from 'react';
import { User, Mail, Lock, CheckCircle2, Loader2, ArrowLeft } from 'lucide-react';
import '../styles.css';
import '../styles/auth-modern.css';
import { postJson } from '../utils/api';

type Props = {
  onBack?: () => void;
  onLogin?: () => void;
};

const departments = ['CSE', 'ECE', 'EEE', 'MECH', 'CIVIL', 'IT'];

const passwordStrength = (pwd: string) => {
  let score = 0;
  if (pwd.length >= 8) score++;
  if (/[A-Z]/.test(pwd)) score++;
  if (/[0-9]/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;
  return score;
};

const StudentRegisterPage = ({ onBack, onLogin }: Props) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [regNo, setRegNo] = useState('');
  const [dept, setDept] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [agree, setAgree] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const validateEmail = (value: string) => /[^@\s]+@[^@\s]+\.[^@\s]+/.test(value);

  const handleSubmit = async () => {
    setError('');
    setSuccess(false);
    if (!name || !email || !regNo || !dept || !password || !confirm) {
      setError('Please fill in all fields.');
      return;
    }
    if (!validateEmail(email)) {
      setError('Please enter a valid email address.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    if (!agree) {
      setError('Please agree to the terms.');
      return;
    }
    setLoading(true);
    try {
      await postJson<void>(`/api/student/auth/register?universityRegNo=${encodeURIComponent(regNo)}`, {
        email,
        password
      });
      setSuccess(true);
      if (onLogin) {
        onLogin();
      }
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const strength = passwordStrength(password);
  const strengthLabels = ['Weak', 'Fair', 'Good', 'Strong'];

  return (
    <div className="login-shell">
      <div className="login-card fade-in">
        <div className="login-brand">
          <div className="brand-badge">VC</div>
          <h1>VCET CampusHire</h1>
          <p>Smart placement management for students and recruiters.</p>
          <div className="brand-illustration">
            <div className="orb orb-1" />
            <div className="orb orb-2" />
            <div className="orb orb-3" />
            <div className="device laptop" />
            <div className="device vehicle" />
            <div className="device gear" />
          </div>
        </div>

        <div className="login-form">
          <div className="auth-header">
            <h2>Student Registration</h2>
            <p>Create your placement account</p>
          </div>

          <div className="auth-form">
            <div className="two-col">
              <label>
                Full Name
                <div className="input-wrap">
                  <User size={16} />
                  <input value={name} onChange={(e) => setName(e.target.value)} placeholder="John Doe" />
                </div>
              </label>
              <label>
                Email
                <div className="input-wrap">
                  <Mail size={16} />
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="student@vcet.edu" />
                </div>
              </label>
            </div>

            <div className="two-col">
              <label>
                University Registration Number
                <div className="input-wrap">
                  <input value={regNo} onChange={(e) => setRegNo(e.target.value)} placeholder="VCET2026CSE123" />
                </div>
              </label>
              <label>
                Department
                <div className="input-wrap">
                  <select value={dept} onChange={(e) => setDept(e.target.value)}>
                    <option value="" disabled>Select Department</option>
                    {departments.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
              </label>
            </div>

            <div className="two-col">
              <label>
                Password
                <div className="input-wrap">
                  <Lock size={16} />
                  <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
                </div>
              </label>
              <label>
                Confirm Password
                <div className="input-wrap">
                  <Lock size={16} />
                  <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="••••••••" />
                </div>
              </label>
            </div>

            <div className="pw-strength">
              <span>Password strength:</span>
              <div className={`bar score-${strength}`} />
              <span>{strength ? strengthLabels[strength - 1] : 'Weak'}</span>
            </div>

            <label className="checkbox">
              <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} /> I agree to the terms
            </label>

            {error && <div className="auth-error">{error}</div>}
            {success && (
              <div className="alert success">
                <CheckCircle2 size={16} /> Registration successful. Redirecting to login...
              </div>
            )}

            <button className="primary-btn" onClick={handleSubmit} disabled={loading}>
              {loading ? <Loader2 className="spinner" size={16} /> : 'Register'}
            </button>

            <div className="auth-row">
              <button className="link-btn" onClick={onBack}><ArrowLeft size={14} /> Back</button>
              <button className="link-btn" onClick={onLogin}>Already have an account? Login</button>
            </div>
          </div>
        </div>
      </div>

      {success && (
        <div className="modal-overlay">
          <div className="modal">
            <CheckCircle2 size={32} color="#16a34a" />
            <h3>Registration Successful</h3>
            <p>You will be redirected to login.</p>
            <button className="primary-btn" onClick={onLogin}>Go to Login</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentRegisterPage;
