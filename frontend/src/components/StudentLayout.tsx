import { ReactNode, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Briefcase, FileText, Bell,
  User, LogOut, ChevronRight, Search, Menu, X,
  GraduationCap, Award, Megaphone
} from 'lucide-react';
import { ROUTES } from '../utils/routes';

type Props = {
  children: ReactNode;
};

const navItems = [
  { key: 'dashboard',      label: 'Dashboard',        icon: <LayoutDashboard size={16} />, path: ROUTES.studentDashboard     },
  { key: 'drives',         label: 'Browse Drives',    icon: <Briefcase size={16} />,       path: ROUTES.studentDrives        },
  { key: 'applications',   label: 'My Applications',  icon: <FileText size={16} />,        path: ROUTES.studentApplications  },
  { key: 'offers',         label: 'My Offers',        icon: <Award size={16} />,           path: ROUTES.studentOffers        },
  { key: 'announcements',  label: 'Announcements',    icon: <Megaphone size={16} />,       path: ROUTES.studentAnnouncements },
  { key: 'profile',        label: 'My Profile',       icon: <User size={16} />,            path: ROUTES.studentProfile       },
  { key: 'notifications',  label: 'Notifications',    icon: <Bell size={16} />,            path: ROUTES.studentNotifications },
];

export default function StudentLayout({ children }: Props) {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const email = localStorage.getItem('email') || '';
  const name  = localStorage.getItem('name')  || email.split('@')[0] || 'Student';
  const activeKey = navItems.find(n => location.pathname === n.path)?.key ?? 'dashboard';

  const handleLogout = () => {
    localStorage.clear();
    navigate(ROUTES.studentLogin, { replace: true });
  };

  return (
    <div className="sd-shell">
      {/* ── Mobile overlay ── */}
      {sidebarOpen && (
        <div className="sd-overlay" onClick={() => setSidebarOpen(false)} />
      )}

      {/* ── Sidebar ── */}
      <aside className={`sd-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sd-brand">
          <div className="sd-brand-icon">
            <GraduationCap size={22} color="#fff" />
          </div>
          <div>
            <div className="sd-brand-name">CampusHire</div>
            <div className="sd-brand-sub">Student Portal</div>
          </div>
          <button className="sd-close-btn" onClick={() => setSidebarOpen(false)}>
            <X size={18} />
          </button>
        </div>

        {/* Student info chip */}
        <div className="sd-user-chip">
          <div className="sd-user-avatar">{name.charAt(0).toUpperCase()}</div>
          <div className="sd-user-info">
            <div className="sd-user-name">{name}</div>
            <div className="sd-user-email">{email}</div>
          </div>
        </div>

        {/* Nav items */}
        <nav className="sd-nav">
          {navItems.map(item => (
            <button
              key={item.key}
              className={`sd-nav-item ${activeKey === item.key ? 'active' : ''}`}
              onClick={() => { navigate(item.path); setSidebarOpen(false); }}
            >
              <span className="sd-nav-icon">{item.icon}</span>
              <span className="sd-nav-label">{item.label}</span>
              <ChevronRight size={13} className="sd-nav-arrow" />
            </button>
          ))}
        </nav>

        {/* Logout */}
        <button className="sd-logout-btn" onClick={handleLogout}>
          <LogOut size={15} />
          <span>Logout</span>
        </button>
      </aside>

      {/* ── Main content ── */}
      <div className="sd-main">
        {/* Top bar */}
        <header className="sd-topbar">
          <button className="sd-menu-btn" onClick={() => setSidebarOpen(true)}>
            <Menu size={20} />
          </button>
          <div className="sd-search-wrap">
            <Search size={14} color="#94a3b8" />
            <input placeholder="Search drives, companies…" />
          </div>
          <div className="sd-topbar-right">
            <button className="sd-notif-btn" onClick={() => navigate(ROUTES.studentNotifications)}>
              <Bell size={18} />
            </button>
            <div className="sd-topbar-avatar" onClick={() => navigate(ROUTES.studentProfile)}>
              {name.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        {/* Page content */}
        <div className="sd-content">
          {children}
        </div>
      </div>
    </div>
  );
}
