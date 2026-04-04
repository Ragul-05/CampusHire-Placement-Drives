import { ReactNode, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Bell, Search, ChevronRight, LineChart as LineIcon, Users,
  ClipboardCheck, Briefcase, ListChecks, BarChart3, Megaphone, Shield, Layers
} from 'lucide-react';
import '../styles/dashboard.css';
import { ProfileDropdown, ViewProfileModal, EditProfileModal, useAdminProfile } from './AdminProfile';
import { ROUTES } from '../utils/routes';

type Props = {
  children: ReactNode;
  activeNav?: 'overview' | 'verification' | 'students' | 'drives' | 'filtering' | 'stages' | 'placementResults' | 'analytics' | 'alerts' | 'reports';
  onNavigate?: (view: any) => void;
};

export default function FacultyLayout({ children, activeNav, onNavigate }: Props) {
  const { profile, refreshProfile } = useAdminProfile();
  const navigate  = useNavigate();
  const location  = useLocation();

  const [showDropdown,      setShowDropdown]      = useState(false);
  const [showViewModal,     setShowViewModal]      = useState(false);
  const [showEditModal,     setShowEditModal]      = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm]  = useState(false);

  const navItems = [
    { key: 'overview',     label: 'Dashboard',           icon: <LineIcon       size={16} />, path: ROUTES.facultyDashboard    },
    { key: 'verification', label: 'Profile Verification', icon: <ClipboardCheck size={16} />, path: ROUTES.studentVerification  },
    { key: 'students',     label: 'Student Management',   icon: <Users          size={16} />, path: ROUTES.studentManagement   },
    { key: 'drives',       label: 'Department Drives',    icon: <Briefcase      size={16} />, path: ROUTES.departmentDrives    },
    { key: 'filtering',    label: 'Drive Filtering',      icon: <ListChecks     size={16} />, path: ROUTES.driveFiltering      },
    { key: 'stages',       label: 'Stage Management',     icon: <Layers         size={16} />, path: ROUTES.stageManagement     },
    { key: 'placementResults', label: 'Placement Results', icon: <BarChart3      size={16} />, path: ROUTES.facultyPlacementResults },
    { key: 'analytics',    label: 'Analytics',            icon: <BarChart3      size={16} />, path: ROUTES.analytics           },
    { key: 'alerts',       label: 'Announcements',        icon: <Megaphone      size={16} />, path: ROUTES.announcements       },
    { key: 'reports',      label: 'Activity Logs',        icon: <Shield         size={16} />, path: ROUTES.auditLogs           },
  ];

  const activeKey = navItems.find(n => location.pathname === n.path)?.key ?? activeNav ?? 'overview';

  const handleLogout = () => {
    localStorage.clear();
    navigate(ROUTES.adminLogin, { replace: true });
  };

  return (
    <div className="dashboard-shell">
      {/* ── Sidebar (unchanged) ── */}
      <aside className="sidebar">
        <div className="brand">Faculty Portal</div>
        <div className="nav-list">
          {navItems.map(item => (
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

      {/* ── Main ── */}
      <main className="main">
        {/* ── Topbar — same structure as AdminLayout ── */}
        <header className="topbar">
          <div className="search">
            <Search size={16} color="#94a3b8" />
            <input placeholder="Search students, profiles, drives…" />
          </div>
          <div className="actions">
            <button className="icon-button" aria-label="Notifications">
              <Bell size={18} />
            </button>

            {/* Avatar + dropdown */}
            <div className="profile-menu-container">
              <div
                className="profile-avatar-trigger"
                onClick={() => setShowDropdown(!showDropdown)}
              >
                {profile?.email?.charAt(0).toUpperCase() || 'F'}
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

      {/* ── Modals ── */}
      <ViewProfileModal
        show={showViewModal}
        onClose={() => setShowViewModal(false)}
        profile={profile}
        onLogout={() => {}}
      />
      <EditProfileModal
        show={showEditModal}
        onClose={() => setShowEditModal(false)}
        profile={profile}
        onSuccess={() => { refreshProfile(); }}
        onLogout={() => {}}
      />

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
