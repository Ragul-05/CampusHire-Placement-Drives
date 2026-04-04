/**
 * routes.ts — single source of truth for all route paths.
 * Import from here — never from App.tsx — to avoid circular deps.
 */
export const ROUTES = {
  home:                 '/',
  adminLogin:           '/login',
  studentLogin:         '/student/login',
  studentRegister:      '/student/register',
  // Student
  studentDashboard:     '/student/dashboard',
  studentDrives:        '/student/drives',
  studentApplications:  '/student/applications',
  studentProfile:       '/student/profile',
  studentNotifications: '/student/notifications',
  studentOffers:        '/student/offers',
  studentAnnouncements: '/student/announcements',
  // Admin / Placement Head
  placementDashboard:   '/admin/dashboard',
  companyManagement:    '/admin/companies',
  driveManagement:      '/admin/drives',
  driveEligibility:     '/admin/eligibility',
  shortlisting:         '/admin/shortlisting',
  driveApprovals:       '/admin/drive-approvals',
  offerManagement:      '/admin/offers',
  adminPlacementResults: '/admin/placement-results',
  studentManagement:    '/admin/students',
  analytics:            '/admin/analytics',
  announcements:        '/admin/announcements',
  auditLogs:            '/admin/audit-logs',
  // Faculty
  facultyDashboard:     '/faculty/dashboard',
  studentVerification:  '/faculty/profile-verification',
  departmentDrives:     '/faculty/department-drives',
  driveFiltering:       '/faculty/drive-filtering',
  stageManagement:      '/faculty/stage-management',
  facultyPlacementResults: '/faculty/placement-results',
} as const;

export type RoutePath = typeof ROUTES[keyof typeof ROUTES];
