import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import GetStartedPage from './pages/GetStarted';
import AdminFacultyLoginPage from './pages/AdminFacultyLogin';
import StudentLoginPage from './pages/StudentLogin';
import StudentRegisterPage from './pages/StudentRegister';
import PlacementHeadDashboard from './pages/PlacementHeadDashboard';
import FacultyDashboard from './pages/FacultyDashboard';
import StudentVerification from './pages/StudentVerification';
import DriveFiltering from './pages/DriveFiltering';
import CompanyManagement from './pages/CompanyManagement';
import DriveManagement from './pages/DriveManagement';
import DriveEligibility from './pages/DriveEligibility';
import Shortlisting from './pages/Shortlisting';
import DriveApprovals from './pages/DriveApprovals';
import OfferManagement from './pages/OfferManagement';
import StudentManagement from './pages/StudentManagement';
import Analytics from './pages/Analytics';
import Announcements from './pages/Announcements';
import AuditLogs from './pages/AuditLogs';
import StageManagement from './pages/StageManagement';
import DepartmentDrives from './pages/DepartmentDrives';
import PlacementResults from './pages/PlacementResults';
import StudentDashboard    from './pages/StudentDashboard';
import StudentDrives       from './pages/StudentDrives';
import StudentApplications from './pages/StudentApplications';
import StudentProfile      from './pages/StudentProfile';
import StudentOffers       from './pages/StudentOffers';
import StudentAnnouncements from './pages/StudentAnnouncements';
import StudentNotifications from './pages/StudentNotifications';

/* ── Route path constants — imported from utils/routes.ts to avoid circular deps ── */
export { ROUTES } from './utils/routes';
import { ROUTES } from './utils/routes';

/* View-name → path lookup used by onNavigate */
const VIEW_TO_PATH: Record<string, string> = {
  home:                ROUTES.home,
  adminLogin:          ROUTES.adminLogin,
  studentLogin:        ROUTES.studentLogin,
  studentRegister:     ROUTES.studentRegister,
  studentDashboard:    ROUTES.studentDashboard,
  placementDashboard:  ROUTES.placementDashboard,
  companyManagement:   ROUTES.companyManagement,
  driveManagement:     ROUTES.driveManagement,
  driveEligibility:    ROUTES.driveEligibility,
  shortlisting:        ROUTES.shortlisting,
  driveApprovals:      ROUTES.driveApprovals,
  offerManagement:     ROUTES.offerManagement,
  studentManagement:   ROUTES.studentManagement,
  analytics:           ROUTES.analytics,
  announcements:       ROUTES.announcements,
  auditLogs:           ROUTES.auditLogs,
  facultyDashboard:    ROUTES.facultyDashboard,
  studentVerification: ROUTES.studentVerification,
  departmentDrives:    ROUTES.departmentDrives,
  driveFiltering:      ROUTES.driveFiltering,
  stageManagement:     ROUTES.stageManagement,
  adminPlacementResults: ROUTES.adminPlacementResults,
  facultyPlacementResults: ROUTES.facultyPlacementResults,
};

function RequireStudent({ children }: { children: JSX.Element }) {
  const role = localStorage.getItem('role');
  const token = localStorage.getItem('token');
  if (role !== 'STUDENT' || !token) return <Navigate to={ROUTES.studentLogin} replace />;
  return children;
}

function RequireFaculty({ children }: { children: JSX.Element }) {
  const role = localStorage.getItem('role');
  const token = localStorage.getItem('token');
  if (role !== 'FACULTY' || !token) return <Navigate to={ROUTES.adminLogin} replace />;
  return children;
}

function RequireAdmin({ children }: { children: JSX.Element }) {
  const role = localStorage.getItem('role');
  const token = localStorage.getItem('token');
  if (role !== 'PLACEMENT_HEAD' || !token) return <Navigate to={ROUTES.adminLogin} replace />;
  return children;
}

/* ── Not Found page ── */
function NotFound() {
  const navigate = useNavigate();
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', height: '100vh', gap: 16, fontFamily: 'inherit'
    }}>
      <h1 style={{ fontSize: 64, fontWeight: 900, color: '#e2e8f0', margin: 0 }}>404</h1>
      <h2 style={{ margin: 0, color: '#1e293b' }}>Page Not Found</h2>
      <p style={{ color: '#64748b' }}>The page you're looking for doesn't exist.</p>
      <button
        className="btn-primary"
        onClick={() => navigate(ROUTES.home)}
        style={{ marginTop: 8 }}
      >
        Go Home
      </button>
    </div>
  );
}

/* ── Main App — useNavigate for onNavigate ── */
function AppRoutes() {
  const navigate = useNavigate();

  /* Shared onNavigate: accepts view-name string → pushes correct URL */
  const goto = (viewName: string) => {
    const path = VIEW_TO_PATH[viewName];
    if (path) {
      navigate(path);
    } else {
      // If already a path (starts with /), navigate directly
      if (viewName.startsWith('/')) navigate(viewName);
    }
  };

  return (
    <Routes>
      {/* Public */}
      <Route path={ROUTES.home}            element={<GetStartedPage onAdminLogin={() => goto('adminLogin')} onStudentLogin={() => goto('studentLogin')} onStudentRegister={() => goto('studentRegister')} />} />
      <Route path={ROUTES.adminLogin}      element={<AdminFacultyLoginPage onBack={() => goto('home')} onSuccess={(role) => {
        if (role === 'PLACEMENT_HEAD') goto('placementDashboard');
        else if (role === 'FACULTY')   goto('facultyDashboard');
      }} />} />
      <Route path={ROUTES.studentLogin}    element={<StudentLoginPage onBack={() => goto('home')} onRegister={() => goto('studentRegister')} />} />
      <Route path={ROUTES.studentRegister} element={<StudentRegisterPage onBack={() => goto('home')} onLogin={() => goto('studentLogin')} />} />

      {/* ── Student routes (protected) ── */}
      <Route path={ROUTES.studentDashboard}     element={<RequireStudent><StudentDashboard    /></RequireStudent>} />
      <Route path={ROUTES.studentDrives}        element={<RequireStudent><StudentDrives       /></RequireStudent>} />
      <Route path={ROUTES.studentApplications}  element={<RequireStudent><StudentApplications /></RequireStudent>} />
      <Route path={ROUTES.studentOffers}        element={<RequireStudent><StudentOffers       /></RequireStudent>} />
      <Route path={ROUTES.studentAnnouncements} element={<RequireStudent><StudentAnnouncements /></RequireStudent>} />
      <Route path={ROUTES.studentProfile}       element={<RequireStudent><StudentProfile      /></RequireStudent>} />
      <Route path={ROUTES.studentNotifications} element={<RequireStudent><StudentNotifications /></RequireStudent>} />

      {/* ── Faculty routes (protected) ── */}
      <Route path={ROUTES.facultyDashboard}    element={<RequireFaculty><FacultyDashboard    onNavigate={goto} /></RequireFaculty>} />
      <Route path={ROUTES.departmentDrives}    element={<RequireFaculty><DepartmentDrives    onNavigate={goto} /></RequireFaculty>} />
      <Route path={ROUTES.studentVerification} element={<RequireFaculty><StudentVerification onNavigate={goto} /></RequireFaculty>} />
      <Route path={ROUTES.driveFiltering}      element={<RequireFaculty><DriveFiltering      onNavigate={goto} /></RequireFaculty>} />
      <Route path={ROUTES.stageManagement}     element={<RequireFaculty><StageManagement     onNavigate={goto} /></RequireFaculty>} />
      <Route path={ROUTES.facultyPlacementResults} element={<RequireFaculty><PlacementResults onNavigate={goto} /></RequireFaculty>} />

      {/* ── Shared faculty+admin routes ── */}
      <Route path={ROUTES.studentManagement}   element={<StudentManagement onNavigate={goto} />} />
      <Route path={ROUTES.analytics}           element={<Analytics         onNavigate={goto} />} />
      <Route path={ROUTES.announcements}       element={<Announcements     onNavigate={goto} />} />
      <Route path={ROUTES.auditLogs}           element={<AuditLogs         onNavigate={goto} />} />

      {/* ── Placement Head / Admin routes (protected) ── */}
      <Route path={ROUTES.placementDashboard} element={<RequireAdmin><PlacementHeadDashboard onNavigate={goto} /></RequireAdmin>} />
      <Route path={ROUTES.companyManagement}  element={<RequireAdmin><CompanyManagement      onNavigate={goto} /></RequireAdmin>} />
      <Route path={ROUTES.driveManagement}    element={<RequireAdmin><DriveManagement        onNavigate={goto} /></RequireAdmin>} />
      <Route path={ROUTES.driveEligibility}   element={<RequireAdmin><DriveEligibility       onNavigate={goto} /></RequireAdmin>} />
      <Route path={ROUTES.shortlisting}       element={<RequireAdmin><Shortlisting           onNavigate={goto} /></RequireAdmin>} />
      <Route path={ROUTES.driveApprovals}     element={<RequireAdmin><DriveApprovals         onNavigate={goto} /></RequireAdmin>} />
      <Route path={ROUTES.offerManagement}    element={<RequireAdmin><OfferManagement        onNavigate={goto} /></RequireAdmin>} />
      <Route path={ROUTES.adminPlacementResults} element={<RequireAdmin><PlacementResults onNavigate={goto} /></RequireAdmin>} />

      {/* ── Catch-all: 404 (NOT redirect to home) ── */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default function App() {
  return <AppRoutes />;
}
