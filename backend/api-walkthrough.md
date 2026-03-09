# CampusHire Backend API Walkthrough

This walkthrough maps the main user journeys (Student, Faculty, Admin) to the concrete controllers/services and highlights key validations and state transitions.

## How to read this
- Requests are REST over JSON; all responses use `ApiResponse<T>`.
- Roles are enforced logically (JWT mocked via query params in dev). Faculty scope is department-bound; Admin is system-wide; Student only self.
- Stages/enums: drive status `UPCOMING|ONGOING|COMPLETED`, application stage `APPLIED→ASSESSMENT→TECHNICAL→HR→SELECTED` (final stage by Admin via offer), verification status `PENDING|VERIFIED|REJECTED`.

---
## 1) Student Journeys

### 1.1 Onboarding & Auth
1. **Register**: `POST /api/student/auth/register` with `universityRegNo` and `AuthRequestDto` → `StudentAuthService.register` creates user + profile skeleton.
2. **Login**: `POST /api/student/auth/login` → `StudentAuthService.login` returns JWT payload (token + role).

### 1.2 Profile Builder (self-serve)
- **Read profile**: `GET /api/student/profile?email=` → `StudentProfileService.getProfileByEmail` aggregates nested personal/contact/academic/schooling.
- **Update sections**: `PUT /personal|/contact|/academic|/schooling` → `StudentProfileService.update...`
  - Guard: throws `ProfileLockedException` when profile locked (post-offer) or already verified.

### 1.3 Discover & Apply to Drives
- **List drives**: `GET /api/student/drives?email=` → `StudentDriveService.getVisibleDrives` merges eligibility (drives + student academic record + allowed departments).
- **Drive details**: `GET /api/student/drives/{id}?email=` → `StudentDriveService.getDriveDetails` (includes eligibility flag).
- **Apply**: `POST /api/student/applications/{driveId}/apply?email=` → `DriveApplicationService.applyForDrive`
  - Validations: profile must be `VERIFIED`, drive must be `ONGOING`, eligibility must pass; duplicate check throws `DuplicateApplicationException`.
- **My applications**: `GET /api/student/applications?email=` → current applications with stage/status.

### 1.4 Student Dashboard & Info
- **Dashboard stats**: `GET /api/student/dashboard/stats` → `StudentDashboardService` aggregates totals (companies, ongoing drives, top CTC).
- **Info feeds**: `/api/student/info/companies|events|announcements` → `InformationService` read-only lists.

---
## 2) Faculty Journeys (department-scoped)

### 2.1 Verify Student Profiles
- **List students**: `GET /api/faculty/students?status=&facultyEmail=` → `FacultyStudentService.getDepartmentStudents` (filters by department + optional status).
- **View student**: `GET /api/faculty/students/{id}?facultyEmail=` → detail view.
- **Verify/Reject**: `POST /api/faculty/students/{id}/verify` with `ProfileVerificationRequestDTO{status,remarks}` → `FacultyStudentService.verifyStudentProfile`
  - Effects: updates `verificationStatus`, writes `ProfileVerification` history, unlocks eligibility pipeline when VERIFIED.

### 2.2 Track Drives & Applications
- **Department drives**: `GET /api/faculty/drives?statuses=&facultyEmail=` → `FacultyDriveService.getDepartmentDrives` (dept filter + status filter).
- **Drive participants**: `GET /api/faculty/drives/{driveId}/participants` → `FacultyDriveService.getDriveParticipants`.
- **Applications list**: `GET /api/faculty/applications` → `FacultyApplicationService.getDepartmentApplications`.
- **Advance stage**: `PUT /api/faculty/applications/{id}/stage` with `StageUpdateRequestDTO{stage}` → `FacultyApplicationService.updateApplicationStage`
  - Guard: only forward progression up to `HR`; `SELECTED` is reserved for Admin offers.

### 2.3 Department Communications & Analytics
- **Announcements**: `GET/POST/DELETE /api/faculty/announcements` → `FacultyAnnouncementService` scoped to department.
- **Events**: `GET/POST/DELETE /api/faculty/events` → `FacultyAnnouncementService` for events.
- **Analytics**: `GET /api/faculty/analytics` → `FacultyAnalyticsService` (top recruiters, avg package, placement % per department).
- **Dashboard**: `GET /api/faculty/dashboard/stats` → `FacultyDashboardService` metrics snapshot.

---
## 3) Admin Journeys (placement office)

### 3.1 Company & Drive Lifecycle
- **Company CRUD**: `POST/PUT/GET` via `AdminCompanyService`.
- **Create/Update drive**: `POST/PUT /api/admin/drives` → `AdminPlacementDriveService.create|updateDrive`.
- **Change drive status**: `PATCH /api/admin/drives/{id}/status?status=` → transitions across `UPCOMING/ONGOING/COMPLETED`; invalid transitions throw `InvalidDriveStateException`.
- **Eligibility**: `POST/GET /api/admin/drives/{id}/eligibility` → `AdminEligibilityService.set|getEligibilityCriteria`.

### 3.2 Shortlisting & Participation
- **Eligible applicants**: `GET /shortlist/eligible` → `AdminShortlistService.getEligibleApplicants` (server-side eligibility check).
- **Generate shortlist**: `POST /shortlist/generate` with `ShortlistRequestDTO` → persists shortlist; audited.
- **Participation stats**: `GET /participation` → `AdminParticipationService.getDriveParticipationStats` (counts applied/eligible).

### 3.3 Offers & Completion
- **Record offer**: `POST /placements/offers` with `OfferRequestDTO{studentId,ctcLpa,role}` → `AdminFinalPlacementService.recordOffer`
  - Effects: marks application `SELECTED`, updates student profile (`isPlaced=true`, `numberOfOffers++`, `isLocked=true`), drives completion path.
- **List offers**: `GET /placements/offers` → offers for drive.
- **Mark drive completed**: `PATCH /placements/complete` → `AdminFinalPlacementService.markDriveCompleted`.

### 3.4 Governance, Audit, Exports, Analytics
- **Dashboard stats**: `GET /api/admin/dashboard/stats` → `AdminDashboardService` (totals, verified, placed, active drives).
- **Placement analytics**: `GET /api/admin/analytics/placements` → `AdminAnalyticsService` macro KPIs.
- **Audit logs**: `GET /api/admin/audit?query=` → `AdminAuditService` (populated by AOP `@AuditAction`).
- **Exports**: `GET /api/admin/export/students` and `/drives/{id}/results` → `AdminExportService` returns CSV.
- **Student admin ops**: search/view/lock via `/api/admin/students` → `AdminStudentService`; lock toggles `isLocked` with audit.
- **Announcements**: admin-wide broadcasts via `/api/admin/announcements`.

---
## 4) Architecture Notes (where logic lives)
- **Controllers**: under `Controllers/` (see API list above).
- **Services**: `Services/` hold business logic and validation; most methods are transactional.
- **Repositories**: Spring Data JPA interfaces for entities (Users, StudentProfile, PlacementDrive, DriveApplication, Offer, etc.).
- **Aspects**: `AdminAuditAspect`, `LoggingAspect`, `StudentAccessAspect` wrap sensitive endpoints and mock identity for dev.
- **DTOs/Mappers**: request/response contracts under `DTOs/` (Admin/Faculty/Student packages) with validation annotations.
- **Exceptions**: centralized handling in `GlobalExceptionHandler` → consistent error shape.

---
## 5) Running & Testing
- **Run locally**: from `backend/` run
  ```
  mvnw.cmd spring-boot:run
  ```
- **Quick smoke**: call `POST /api/student/auth/login`, then `GET /api/student/drives?email=student@example.com` (or set Bearer token if JWT wired).
- **Mock identities**: supply `?email=` for student, `?facultyEmail=` for faculty, `?email=` for admin on audited routes.

## 6) Troubleshooting
- 400 on apply: check drive status `ONGOING`, profile `VERIFIED`, and eligibility criteria.
- 400 on profile update: profile likely locked or already verified.
- Stage update fails: ensure forward-only progression and faculty cannot set `SELECTED`.
- Exports empty: ensure students are verified and applications/offers exist for the drive.
- Audit missing: ensure endpoint has `@AuditAction` and audit table not truncated.
