import { useEffect, useRef, useState } from 'react';
import {
  X, Mail, Shield, Building2, Calendar, Edit2, LogOut,
  User, Lock, Eye, EyeOff, CheckCircle2, AlertCircle,
  BadgeCheck, Hash, UserCircle2, ChevronRight
} from 'lucide-react';
import { getJson, putJson, facultyUrl } from '../utils/api';

/* ══════════════════════════════════
   TYPES
══════════════════════════════════ */
export type FacultyProfileData = {
  id: number;
  email: string;
  name: string;
  role: string;
  universityRegNo: string;
  departmentName: string | null;
  employeeId: string | null;
  isActive: boolean;
  createdAt: string | null;
};

/* ══════════════════════════════════
   HOOK — load + cache faculty profile
══════════════════════════════════ */
export function useFacultyProfile() {
  const [profile, setProfile] = useState<FacultyProfileData | null>(null);
  const [loading, setLoading]  = useState(true);

  async function load() {
    try {
      setLoading(true);
      const email = localStorage.getItem('email') || '';
      const name  = localStorage.getItem('name')  || email.split('@')[0] || 'Faculty';
      const dept  = localStorage.getItem('department') || null;

      /* Try fetching from backend first */
      try {
        const res = await getJson<FacultyProfileData>(
          facultyUrl('/api/faculty/profile')
        );
        if (res.data) {
          setProfile(res.data);
          setLoading(false);
          return;
        }
      } catch {
        /* Faculty profile endpoint may not exist — fall through to localStorage */
      }

      /* Fallback: build from localStorage */
      setProfile({
        id: 0,
        email,
        name,
        role: 'FACULTY',
        universityRegNo: localStorage.getItem('universityRegNo') || '',
        departmentName: dept,
        employeeId: localStorage.getItem('employeeId') || null,
        isActive: true,
        createdAt: null,
      });
    } catch (err) {
      console.error('Failed to load faculty profile', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  return { profile, loading, refreshProfile: load };
}

/* ══════════════════════════════════
   TINY HELPERS
══════════════════════════════════ */
function fmtDate(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric'
  });
}

function initials(name: string, email: string) {
  if (name && name.trim()) return name.trim().charAt(0).toUpperCase();
  return (email || 'F').charAt(0).toUpperCase();
}

/* password strength */
function pwdStrength(pw: string): { score: number; label: string; color: string } {
  if (!pw) return { score: 0, label: '', color: '#e2e8f0' };
  let s = 0;
  if (pw.length >= 6)  s++;
  if (pw.length >= 10) s++;
  if (/[A-Z]/.test(pw)) s++;
  if (/[0-9]/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  const map = [
    { score: 0, label: '',         color: '#e2e8f0' },
    { score: 1, label: 'Weak',     color: '#ef4444' },
    { score: 2, label: 'Fair',     color: '#f59e0b' },
    { score: 3, label: 'Good',     color: '#3b82f6' },
    { score: 4, label: 'Strong',   color: '#10b981' },
    { score: 5, label: 'Very Strong', color: '#059669' },
  ];
  return map[Math.min(s, 5)];
}

/* ══════════════════════════════════
   DROPDOWN
══════════════════════════════════ */
type DropdownProps = {
  profile: FacultyProfileData | null;
  onViewProfile:  () => void;
  onEditProfile:  () => void;
  onLogout:       () => void;
};

export function FacultyProfileDropdown({ profile, onViewProfile, onEditProfile, onLogout }: DropdownProps) {
  const name  = profile?.name  || profile?.email?.split('@')[0] || 'Faculty';
  const email = profile?.email || '';
  const dept  = profile?.departmentName || localStorage.getItem('department') || '';

  return (
    <div className="fp-dropdown">
      {/* Header chip */}
      <div className="fp-dropdown-header">
        <div className="fp-dropdown-avatar">
          {initials(name, email)}
        </div>
        <div className="fp-dropdown-info">
          <div className="fp-dropdown-name">{name}</div>
          <div className="fp-dropdown-role">
            <BadgeCheck size={11} /> FACULTY
          </div>
          {dept && <div className="fp-dropdown-dept">{dept}</div>}
        </div>
      </div>

      <div className="fp-divider" />

      <button className="fp-dropdown-item" onClick={onViewProfile}>
        <span className="fp-item-icon view"><User size={15} /></span>
        <span className="fp-item-label">View Profile</span>
        <ChevronRight size={13} className="fp-item-arrow" />
      </button>

      <button className="fp-dropdown-item" onClick={onEditProfile}>
        <span className="fp-item-icon edit"><Edit2 size={15} /></span>
        <span className="fp-item-label">Edit Profile</span>
        <ChevronRight size={13} className="fp-item-arrow" />
      </button>

      <div className="fp-divider" />

      <button className="fp-dropdown-item logout" onClick={onLogout}>
        <span className="fp-item-icon logout-icon"><LogOut size={15} /></span>
        <span className="fp-item-label">Logout</span>
      </button>
    </div>
  );
}

/* ══════════════════════════════════
   VIEW PROFILE MODAL
══════════════════════════════════ */
type ViewProps = {
  profile: FacultyProfileData | null;
  onClose: () => void;
};

export function FacultyViewProfileModal({ profile, onClose }: ViewProps) {
  if (!profile) return null;

  const name  = profile.name  || profile.email?.split('@')[0] || 'Faculty';
  const email = profile.email || '';

  const rows = [
    { icon: <UserCircle2 size={16} />, label: 'Full Name',      value: name,                    color: '#6366f1' },
    { icon: <Mail        size={16} />, label: 'Email',          value: email,                   color: '#3b82f6' },
    { icon: <Shield      size={16} />, label: 'Role',           value: 'FACULTY',               color: '#8b5cf6' },
    { icon: <Building2   size={16} />, label: 'Department',     value: profile.departmentName ?? '—', color: '#10b981' },
    { icon: <Hash        size={16} />, label: 'University Reg', value: profile.universityRegNo  || '—', color: '#f59e0b' },
    { icon: <BadgeCheck  size={16} />, label: 'Employee ID',    value: profile.employeeId       || '—', color: '#06b6d4' },
    { icon: <Calendar    size={16} />, label: 'Created',        value: fmtDate(profile.createdAt), color: '#64748b' },
    { icon: <Shield      size={16} />, label: 'Status',
      value: null,
      badge: profile.isActive ? 'Active' : 'Inactive',
      badgeClass: profile.isActive ? 'success' : 'danger',
      color: '#64748b'
    },
  ];

  return (
    <div className="fp-modal-overlay" onClick={onClose}>
      <div className="fp-modal fp-view-modal" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="fp-modal-header">
          <div className="fp-modal-header-inner">
            <div className="fp-modal-big-avatar">
              {initials(name, email)}
            </div>
            <div>
              <h2 className="fp-modal-title">{name}</h2>
              <p className="fp-modal-sub">{email}</p>
              <span className="badge info fp-role-badge">
                <BadgeCheck size={11} /> FACULTY
              </span>
            </div>
          </div>
          <button className="fp-close-btn" onClick={onClose}><X size={18} /></button>
        </div>

        {/* Body — 2-col grid */}
        <div className="fp-modal-body">
          <div className="fp-info-grid">
            {rows.map((row, i) => (
              <div key={i} className="fp-info-card">
                <div className="fp-info-card-icon" style={{ color: row.color, background: `${row.color}14` }}>
                  {row.icon}
                </div>
                <div className="fp-info-card-body">
                  <span className="fp-info-card-label">{row.label}</span>
                  {row.badge
                    ? <span className={`badge ${row.badgeClass} fp-info-card-value`}>{row.badge}</span>
                    : <span className="fp-info-card-value">{row.value}</span>
                  }
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="fp-modal-footer">
          <button className="btn-secondary" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════
   EDIT PROFILE MODAL
══════════════════════════════════ */
type EditProps = {
  profile: FacultyProfileData | null;
  onClose:   () => void;
  onSuccess: () => void;
};

export function FacultyEditProfileModal({ profile, onClose, onSuccess }: EditProps) {
  const [name,        setName]       = useState('');
  const [email,       setEmail]      = useState('');
  const [pwd,         setPwd]        = useState('');
  const [showPwd,     setShowPwd]    = useState(false);
  const [submitting,  setSubmitting] = useState(false);
  const [errors,      setErrors]     = useState<Record<string, string>>({});
  const [toast,       setToast]      = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const strength = pwdStrength(pwd);

  useEffect(() => {
    if (profile) {
      setName(profile.name  || profile.email?.split('@')[0] || '');
      setEmail(profile.email || '');
      setPwd('');
      setErrors({});
    }
  }, [profile]);

  function validate() {
    const e: Record<string, string> = {};
    if (!name.trim())  e.name = 'Name is required';
    if (!email.trim()) e.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'Invalid email format';
    if (pwd && pwd.length < 6) e.pwd = 'Password must be at least 6 characters';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSave() {
    if (!validate()) return;
    try {
      setSubmitting(true);
      const payload: Record<string, string> = {};
      if (name  !== profile?.name)  payload.name  = name.trim();
      if (email !== profile?.email) payload.email = email.trim();
      if (pwd)                       payload.password = pwd;

      if (Object.keys(payload).length === 0) {
        onClose();
        return;
      }

      /* Try faculty-specific endpoint first, fall back to admin */
      try {
        await putJson(
          facultyUrl('/api/faculty/profile'),
          payload
        );
      } catch {
        await putJson('/api/admin/profile', payload);
      }

      /* Update localStorage so navbar reflects new name instantly */
      if (payload.name)  localStorage.setItem('name',  payload.name);
      if (payload.email) localStorage.setItem('email', payload.email);

      setToast({ msg: 'Profile updated successfully!', type: 'success' });
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1200);
    } catch (err: any) {
      setToast({ msg: err?.message || 'Failed to update profile', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  }

  if (!profile) return null;

  return (
    <div className="fp-modal-overlay" onClick={onClose}>
      <div className="fp-modal fp-edit-modal" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="fp-modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div className="fp-edit-header-icon">
              <Edit2 size={20} />
            </div>
            <div>
              <h2 className="fp-modal-title">Edit Profile</h2>
              <p className="fp-modal-sub">Update your account information</p>
            </div>
          </div>
          <button className="fp-close-btn" onClick={onClose}><X size={18} /></button>
        </div>

        {/* Toast inside modal */}
        {toast && (
          <div className={`fp-inline-toast ${toast.type}`}>
            {toast.type === 'success'
              ? <CheckCircle2 size={16} />
              : <AlertCircle  size={16} />}
            <span>{toast.msg}</span>
          </div>
        )}

        {/* Body */}
        <div className="fp-modal-body">

          {/* Editable fields */}
          <div className="fp-form-section">
            <div className="fp-form-section-title">Editable Information</div>

            {/* Name */}
            <div className="fp-field">
              <label className="fp-label">
                Full Name <span className="fp-required">*</span>
              </label>
              <div className={`fp-input-wrap ${errors.name ? 'error' : ''}`}>
                <UserCircle2 size={15} className="fp-input-icon" />
                <input
                  type="text"
                  className="fp-input"
                  placeholder="Your full name"
                  value={name}
                  onChange={e => { setName(e.target.value); setErrors(p => ({ ...p, name: '' })); }}
                />
              </div>
              {errors.name && <span className="fp-err">{errors.name}</span>}
            </div>

            {/* Email */}
            <div className="fp-field">
              <label className="fp-label">
                Email <span className="fp-required">*</span>
              </label>
              <div className={`fp-input-wrap ${errors.email ? 'error' : ''}`}>
                <Mail size={15} className="fp-input-icon" />
                <input
                  type="email"
                  className="fp-input"
                  placeholder="you@vcet.edu.in"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setErrors(p => ({ ...p, email: '' })); }}
                />
              </div>
              {errors.email && <span className="fp-err">{errors.email}</span>}
            </div>

            {/* Password */}
            <div className="fp-field">
              <label className="fp-label">
                New Password <span className="fp-optional">(optional)</span>
              </label>
              <div className={`fp-input-wrap ${errors.pwd ? 'error' : ''}`}>
                <Lock size={15} className="fp-input-icon" />
                <input
                  type={showPwd ? 'text' : 'password'}
                  className="fp-input"
                  placeholder="Leave blank to keep current"
                  value={pwd}
                  onChange={e => { setPwd(e.target.value); setErrors(p => ({ ...p, pwd: '' })); }}
                />
                <button type="button" className="fp-pwd-toggle" onClick={() => setShowPwd(s => !s)}>
                  {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {errors.pwd && <span className="fp-err">{errors.pwd}</span>}
              {/* Strength bar */}
              {pwd && (
                <div className="fp-strength-wrap">
                  <div className="fp-strength-bar">
                    {[1,2,3,4,5].map(i => (
                      <div
                        key={i}
                        className="fp-strength-seg"
                        style={{ background: i <= strength.score ? strength.color : '#e2e8f0' }}
                      />
                    ))}
                  </div>
                  <span className="fp-strength-label" style={{ color: strength.color }}>
                    {strength.label}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Read-only fields */}
          <div className="fp-form-section">
            <div className="fp-form-section-title">Read-only Information</div>
            <div className="fp-readonly-grid">
              <div className="fp-readonly-item">
                <span className="fp-readonly-label"><Shield size={12} /> Role</span>
                <span className="fp-readonly-value">FACULTY</span>
              </div>
              <div className="fp-readonly-item">
                <span className="fp-readonly-label"><Building2 size={12} /> Department</span>
                <span className="fp-readonly-value">{profile.departmentName ?? '—'}</span>
              </div>
              <div className="fp-readonly-item">
                <span className="fp-readonly-label"><Hash size={12} /> University Reg</span>
                <span className="fp-readonly-value">{profile.universityRegNo || '—'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="fp-modal-footer">
          <button className="btn-secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </button>
          <button
            className="btn-primary fp-save-btn"
            onClick={handleSave}
            disabled={submitting || !name.trim() || !email.trim()}
          >
            {submitting
              ? <><span className="fp-spinner" /> Saving…</>
              : <><CheckCircle2 size={15} /> Save Changes</>}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════
   AVATAR TRIGGER — only for FACULTY
══════════════════════════════════ */
type AvatarProps = {
  profile: FacultyProfileData | null;
  onClick: () => void;
};

export function FacultyAvatarTrigger({ profile, onClick }: AvatarProps) {
  const role = localStorage.getItem('role');
  if (role !== 'FACULTY') return null;           /* ← role restriction */

  const name  = profile?.name  || '';
  const email = profile?.email || '';

  return (
    <div className="fp-avatar-trigger" onClick={onClick} title="My Profile">
      <div className="fp-avatar-ring">
        {initials(name, email)}
      </div>
    </div>
  );
}

/* ══════════════════════════════════
   LOGOUT CONFIRM DIALOG
══════════════════════════════════ */
type LogoutProps = {
  onConfirm: () => void;
  onCancel:  () => void;
};

export function FacultyLogoutConfirm({ onConfirm, onCancel }: LogoutProps) {
  return (
    <div className="fp-modal-overlay" onClick={onCancel}>
      <div className="fp-confirm-dialog" onClick={e => e.stopPropagation()}>
        <div className="fp-confirm-icon">
          <LogOut size={28} />
        </div>
        <h3 className="fp-confirm-title">Confirm Logout</h3>
        <p className="fp-confirm-sub">
          Are you sure you want to logout from your faculty account?
        </p>
        <div className="fp-confirm-actions">
          <button className="btn-secondary" onClick={onCancel}>Cancel</button>
          <button className="btn-danger"    onClick={onConfirm}>Yes, Logout</button>
        </div>
      </div>
    </div>
  );
}
