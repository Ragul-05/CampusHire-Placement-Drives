import { ReactNode, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Bell, ChevronRight, LineChart as LineIcon, Search, Users, Briefcase, Building2, CheckSquare, Award, BarChart3, Megaphone, Shield } from 'lucide-react';
import '../styles/dashboard.css';
import { ProfileDropdown, ViewProfileModal, EditProfileModal, useAdminProfile } from './AdminProfile';
import { ROUTES } from '../utils/routes';

type Props = {
  children: ReactNode;
  activeNav?: 'overview' | 'drives' | 'companies' | 'students' | 'eligibility' | 'shortlisting' | 'approvals' | 'offers' | 'placementResults' | 'analytics' | 'alerts' | 'reports';
  onNavigate?: (view: any) => void;
};

export default function AdminLayout({ children, activeNav, onNavigate }: Props) {
  const { profile, refreshProfile } = useAdminProfile();
  const navigate = useNavigate();
  const location = useLocation();

  const [showDropdown,      setShowDropdown]      = useState(false);
  const [showViewModal,     setShowViewModal]      = useState(false);
  const [showEditModal,     setShowEditModal]      = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm]  = useState(false);

  const navItems = [
    { key: 'overview',     label: 'Overview',       icon: <LineIcon size={16} />,    path: ROUTES.placementDashboard },
    { key: 'companies',    label: 'Companies',      icon: <Building2 size={16} />,   path: ROUTES.companyManagement  },
    { key: 'drives',       label: 'Drives',         icon: <Briefcase size={16} />,   path: ROUTES.driveManagement    },
    { key: 'eligibility',  label: 'Eligibility',    icon: <CheckSquare size={16} />, path: ROUTES.driveEligibility   },
    { key: 'approvals',    label: 'Drive Approvals',icon: <CheckSquare size={16} />, path: ROUTES.driveApprovals     },
    { key: 'offers',       label: 'Offers',         icon: <Award size={16} />,       path: ROUTES.offerManagement    },
    { key: 'placementResults', label: 'Placement Results', icon: <BarChart3 size={16} />, path: ROUTES.adminPlacementResults },
    { key: 'students',     label: 'Students',       icon: <Users size={16} />,       path: ROUTES.studentManagement  },
    { key: 'analytics',    label: 'Analytics',      icon: <BarChart3 size={16} />,   path: ROUTES.analytics          },
    { key: 'alerts',       label: 'Announcements',  icon: <Megaphone size={16} />,   path: ROUTES.announcements      },
    { key: 'reports',      label: 'Audit Logs',     icon: <Shield size={16} />,      path: ROUTES.auditLogs          },
  ];

  const activeKey = navItems.find(n => location.pathname === n.path)?.key ?? activeNav ?? 'overview';

  const handleLogout = () => {
    localStorage.clear();
    navigate(ROUTES.adminLogin, { replace: true });
  };

  return (
    <div className="dashboard-shell">
      <aside className="sidebar">
        <div className="brand">Placement HQ</div>
        <div className="nav-list">
          {navItems.map((item) => (
            <div
              key={item.key}
              className={`nav-item ${activeKey === item.key ? 'active' : ''}`}
              onClick={() => navigate(item.path)}
            >
              {item.icon}
              <span>{item.label}</span>
              <ChevronRight size={14} style={{ marginLeft: 'auto', opacity: 0.5 }} />
            </div>
          ))}
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <div className="search">
            <Search size={16} color="#94a3b8" />
            <input placeholder="Search students, drives, companies…" />
          </div>
          <div className="actions">
            <select>
              <option>Last 30 days</option>
              <option>Last 90 days</option>
              <option>Year to date</option>
            </select>
            <button className="icon-button" aria-label="Notifications">
              <Bell size={18} />
            </button>
            <div className="profile-menu-container">
              <div className="profile-avatar-trigger" onClick={() => setShowDropdown(!showDropdown)}>
                {profile?.email?.charAt(0).toUpperCase() || 'A'}
              </div>
              {showDropdown && (
                <>
                  <div className="dropdown-backdrop" onClick={() => setShowDropdown(false)} />
                  <ProfileDropdown
                    profile={profile}
                    onViewProfile={() => { setShowViewModal(true);     setShowDropdown(false); }}
                    onEditProfile={()  => { setShowEditModal(true);     setShowDropdown(false); }}
                    onLogout={()       => { setShowLogoutConfirm(true); setShowDropdown(false); }}
                  />
                </>
              )}
            </div>
          </div>
        </header>
        {children}
      </main>

      <ViewProfileModal show={showViewModal} onClose={() => setShowViewModal(false)} profile={profile} onLogout={() => {}} />
      <EditProfileModal show={showEditModal} onClose={() => setShowEditModal(false)} profile={profile}
        onSuccess={() => { refreshProfile(); }} onLogout={() => {}} />

      {showLogoutConfirm && (
        <div className="modal-overlay modal-fade-in" onClick={() => setShowLogoutConfirm(false)}>
          <div className="modal-content modal-scale-in" style={{ maxWidth: 400 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3>Confirm Logout</h3></div>
            <div className="modal-body"><p>Are you sure you want to logout?</p></div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowLogoutConfirm(false)}>Cancel</button>
              <button className="btn-primary" style={{ background: '#ef4444' }} onClick={handleLogout}>Logout</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
