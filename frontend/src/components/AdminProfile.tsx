import { useEffect, useState } from 'react';
import { X, Mail, Shield, Building2, Calendar, Edit, LogOut } from 'lucide-react';
import '../styles/dashboard.css';
import { getJson, putJson } from '../utils/api';

type AdminProfile = {
  id: number;
  email: string;
  role: string;
  universityRegNo: string;
  departmentId: number | null;
  departmentName: string | null;
  isActive: boolean;
  createdAt: string | null;
};

type ProfileModalProps = {
  show: boolean;
  onClose: () => void;
  profile: AdminProfile | null;
  onLogout: () => void;
};

export function ProfileDropdown({ profile, onViewProfile, onEditProfile, onLogout }: {
  profile: AdminProfile | null;
  onViewProfile: () => void;
  onEditProfile: () => void;
  onLogout: () => void;
}) {
  return (
    <div className="profile-dropdown">
      <div className="profile-dropdown-header">
        <div className="profile-dropdown-avatar">
          {profile?.email?.charAt(0).toUpperCase() || 'A'}
        </div>
        <div className="profile-dropdown-info">
          <div className="profile-dropdown-name">{profile?.email?.split('@')[0] || 'Admin'}</div>
          <div className="profile-dropdown-role">{profile?.role || 'PLACEMENT_HEAD'}</div>
        </div>
      </div>
      <div className="profile-dropdown-divider"></div>
      <button className="profile-dropdown-item" onClick={onViewProfile}>
        <Shield size={16} />
        <span>View Profile</span>
      </button>
      <button className="profile-dropdown-item" onClick={onEditProfile}>
        <Edit size={16} />
        <span>Edit Profile</span>
      </button>
      <div className="profile-dropdown-divider"></div>
      <button className="profile-dropdown-item logout" onClick={onLogout}>
        <LogOut size={16} />
        <span>Logout</span>
      </button>
    </div>
  );
}

export function ViewProfileModal({ show, onClose, profile }: ProfileModalProps) {
  if (!show || !profile) return null;

  return (
    <div className="modal-overlay modal-fade-in" onClick={onClose}>
      <div className="modal-content profile-modal modal-scale-in" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Admin Profile</h3>
          <button className="icon-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          <div className="profile-view">
            <div className="profile-avatar-large">
              {profile.email.charAt(0).toUpperCase()}
            </div>

            <div className="profile-details">
              <div className="profile-detail-item">
                <Mail size={16} />
                <div>
                  <span className="profile-detail-label">Email</span>
                  <span className="profile-detail-value">{profile.email}</span>
                </div>
              </div>

              <div className="profile-detail-item">
                <Shield size={16} />
                <div>
                  <span className="profile-detail-label">Role</span>
                  <span className="profile-detail-value">{profile.role}</span>
                </div>
              </div>

              {profile.departmentName && (
                <div className="profile-detail-item">
                  <Building2 size={16} />
                  <div>
                    <span className="profile-detail-label">Department</span>
                    <span className="profile-detail-value">{profile.departmentName}</span>
                  </div>
                </div>
              )}

              <div className="profile-detail-item">
                <Calendar size={16} />
                <div>
                  <span className="profile-detail-label">University Reg No</span>
                  <span className="profile-detail-value">{profile.universityRegNo}</span>
                </div>
              </div>

              <div className="profile-detail-item">
                <Shield size={16} />
                <div>
                  <span className="profile-detail-label">Account Status</span>
                  <span className={`badge ${profile.isActive ? 'success' : 'danger'}`}>
                    {profile.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export function EditProfileModal({ show, onClose, profile, onSuccess }: ProfileModalProps & { onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (show && profile) {
      setFormData({
        email: profile.email,
        password: ''
      });
      setError('');
    }
  }, [show, profile]);

  async function handleSubmit() {
    if (!formData.email.trim()) {
      setError('Email is required');
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Invalid email format');
      return;
    }

    // Password validation if provided
    if (formData.password && formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    try {
      setSubmitting(true);
      setError('');

      const updateData: any = {};
      if (formData.email !== profile?.email) {
        updateData.email = formData.email;
      }
      if (formData.password) {
        updateData.password = formData.password;
      }

      // Nothing changed — just close
      if (Object.keys(updateData).length === 0) {
        onClose();
        return;
      }

      const role = localStorage.getItem('role');
      const endpoint = role === 'FACULTY'
        ? '/api/faculty/profile'
        : '/api/admin/profile';

      await putJson(endpoint, updateData);

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to update profile');
    } finally {
      setSubmitting(false);
    }
  }

  if (!show || !profile) return null;

  return (
    <div className="modal-overlay modal-fade-in" onClick={onClose}>
      <div className="modal-content profile-modal modal-scale-in" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Edit Profile</h3>
          <button className="icon-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          {error && (
            <div className="alert alert-error">
              {error}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <label>
              <span style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 600 }}>
                Email <span style={{ color: '#ef4444' }}>*</span>
              </span>
              <input
                type="email"
                placeholder="admin@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </label>

            <label>
              <span style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 600 }}>
                New Password (optional)
              </span>
              <input
                type="password"
                placeholder="Leave blank to keep current"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
              <span style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                Minimum 6 characters
              </span>
            </label>

            <div className="info-banner">
              <Shield size={16} />
              <span style={{ fontSize: '13px' }}>
                Role and University Reg No cannot be modified
              </span>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </button>
          <button
            className="btn-primary"
            onClick={handleSubmit}
            disabled={submitting || !formData.email.trim()}
          >
            {submitting ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

export function useAdminProfile() {
  const [profile, setProfile] = useState<AdminProfile | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadProfile() {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const role  = localStorage.getItem('role');
      const email = localStorage.getItem('email') || '';

      if (!token) {
        setLoading(false);
        return;
      }

      if (role === 'FACULTY') {
        // Call the faculty-specific profile endpoint
        try {
          const res = await getJson<AdminProfile>('/api/faculty/profile');
          setProfile(res.data);
        } catch {
          // Fallback to localStorage if endpoint unavailable
          setProfile({
            id: 0,
            email,
            role: 'FACULTY',
            universityRegNo: '',
            departmentId: null,
            departmentName: localStorage.getItem('department') || null,
            isActive: true,
            createdAt: null,
          });
        }
        setLoading(false);
        return;
      }

      if (role !== 'PLACEMENT_HEAD') {
        setLoading(false);
        return;
      }

      const response = await getJson<AdminProfile>('/api/admin/profile');
      setProfile(response.data);
    } catch (err: any) {
      console.error('Failed to load profile', err);
      // Only clear auth on 401 (token expired) — NOT on 403 (wrong role hit wrong endpoint)
      if (err?.message?.includes('401')) {
        localStorage.removeItem('token');
        localStorage.removeItem('role');
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProfile();
  }, []);

  return { profile, loading, refreshProfile: loadProfile };
}
