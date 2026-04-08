# CampusHire Backend System: Complete System Walkthrough

## 1. Architecture & Stack
- **Framework**: Spring Boot 3 / Java 21, monolith, REST controllers → services → repositories (JPA/Hibernate).
- **Database**: PostgreSQL (entities mirror seed SQL tables); seeds in `seed_data.sql` / `seed_data_utf8.sql` / `dummy_data_seed.sql`.
- **Layers**:
  - Controllers (`Controllers/`): request mapping and response wrapping (`ApiResponse<T>`).
  - Services (`Services/`): transactional business rules, state transitions, validation.
  - Repositories (`Repositories/`): Spring Data JPA for all entities.
  - DTOs/Mappers (`DTOs/`, `Mappers/`): request/response contracts and mapping helpers.
  - Aspects (`AOPs/`): audit logging, logging, student access mocking.
  - Exceptions (`Exceptions/`): surfaced via `GlobalExceptionHandler`.
- **Cross-cutting**: `@AuditAction` + `AdminAuditAspect` writes to `audit_logs`; `LoggingAspect` traces calls; `StudentAccessAspect` allows `?email` shortcuts during dev.

## 2. Domain & State Machines
- **Roles**: `STUDENT`, `FACULTY`, `PLACEMENT_HEAD` (admin).
- **Drive Status**: `UPCOMING`, `ONGOING`, `COMPLETED` (patched by Admin only).
- **Application Stage**: `ELIGIBLE/APPLIED → ASSESSMENT → TECHNICAL → HR → SELECTED | REJECTED`.
- **Profile Verification**: `PENDING`, `VERIFIED`, `REJECTED`; once verified or placed, profile locks (`isLocked`).

## 3. Data Model (tables/entities)
Principal tables from seeds/entities (names as in SQL):
- **Identity**: `users` (email, reg no, role, department_id), `departments`.
- **Student Profile (1-1 splits)**: `student_profiles` (verification_status, is_locked, is_eligible_for_placements, is_placed, number_of_offers, resume_url, batch, roll_no);
  - `student_personal_details` (name, parents, gender, community, dob, hosteler, bio)
  - `student_contact_details` (phones, alt email, address)
  - `academic_records` (cgpa, history/standing arrears, dept, semester)
  - `schooling_details` (X/XII marks, schools, years)
  - `student_identity_docs` (aadhar, pan, passport etc.)
  - `student_professional_profiles`, `student_certifications` (optional extras in seeds)
- **Recruitment**: `companies`; `placement_drives` (title, role, ctc_lpa, status, deadlines, company_id);
  - `drive_eligibility` (cgpa, x/xii %, arrears limits, allowed_depts via `drive_allowed_departments` join);
  - `drive_applications` (student_profile_id, drive_id, stage, status timestamps);
  - `offers` (not in seed but implied via `OfferRequestDTO/OfferResponseDTO`).
- **Comms/Events**: `announcements`, `events`.
- **Governance**: `profile_verifications` (faculty audits), `audit_logs` (AOP actions).

## 4. Controllers → Services (key flows)
- **StudentAuthController → StudentAuthService**: register/login, issues token payload.
- **StudentProfileController → StudentProfileService**: CRUD subsections; blocks when locked/verified.
- **StudentDriveController → StudentDriveService**: list/details with runtime eligibility against `drive_eligibility` + dept allowlist.
- **DriveApplicationController → DriveApplicationService**: apply/list; guards duplicate, eligibility, verification, drive status.
- **StudentDashboardController → StudentDashboardService**: aggregates counts.
- **InformationController → InformationService**: read-only lists for companies/events/announcements.
- **FacultyStudentController → FacultyStudentService**: dept-scoped students, verify/reject, history.
- **FacultyDriveController → FacultyDriveService**: dept drives + participants.
- **FacultyApplicationController → FacultyApplicationService**: dept applications, stage progression (no SELECTED).
- **FacultyAnnouncementController → FacultyAnnouncementService**: dept announcements/events CRUD.
- **FacultyAnalyticsController → FacultyAnalyticsService**: dept analytics (top recruiters, avg LPA, placement%).
- **FacultyDashboardController → FacultyDashboardService**: dept dashboard stats.
- **FacultyAuditController → AdminAuditService**: faculty-scoped activity logs (`/api/faculty/audit`).
- **AdminCompanyController → AdminCompanyService**: company CRUD.
- **AdminPlacementDriveController → AdminPlacementDriveService**: drive CRUD/status changes.
- **AdminEligibilityController → AdminEligibilityService**: set/get eligibility.
- **AdminShortlistController → AdminShortlistService**: eligible list + shortlist generation.
- **AdminParticipationController → AdminParticipationService**: participation stats per drive.
- **AdminFinalPlacementController → AdminFinalPlacementService**: record offers, list offers, mark drive complete (locks profiles).
- **AdminExportController → AdminExportService**: CSV exports (students, drive results).
- **AdminDashboardController → AdminDashboardService**: platform stats.
- **AdminAnalyticsController → AdminAnalyticsService**: macro placement analytics.
- **AdminStudentController → AdminStudentService**: search/view/lock profiles.
- **AdminAnnouncementController → AdminAnnouncementService**: admin-wide announcements.
- **AdminAuditController → AdminAuditService**: query audit logs.
- **PlacementResultsController → PlacementResultsService**: unified placement results endpoint (`/api/placement-results`) + compatibility routes for admin/faculty.
- **StageController → StageUpdateService**: shared stage update API for role-aware stage transitions.

## 5. Transaction & Validation Highlights
- Services use transactional methods for write paths (drive create/update, apply, verify, offers).
- Application stage validation enforces forward-only progression; Admin offer sets final stage/lock.
- Eligibility checks combine drive criteria + dept allowlist + student academic record; failures throw `EligibilityNotMetException`.
- Profile lock/verification guards in update methods (`ProfileLockedException`).
- Duplicate application protected by `DuplicateApplicationException`.

## 6. AOP & Audit
- `@AuditAction` on sensitive endpoints (drive create/update/status, shortlist, offers, exports, announcements, profile lock) → `AdminAuditAspect` writes to `audit_logs` (action, targetEntity, actor/email, timestamp, ip if available).
- `LoggingAspect` adds method-level tracing.
- `StudentAccessAspect` allows `?email=` for student endpoints during dev (simulated principal).
- Audit retrieval is now role-aware at API surface:
  - Admin: `/api/admin/audit`
  - Faculty: `/api/faculty/audit`

## 10. Recent Product Updates (Apr 2026)
- Added full **Placement Results** pages in Admin and Faculty portals.
- Introduced unified backend endpoint **`GET /api/placement-results`** for cross-role result consistency.
- Added **faculty activity logs** endpoint and frontend integration.
- Added **REJECTED** stage handling in placement flows and UI stage color standardization.
- Upgraded export flows (PDF/Excel) to include richer placement + company round analysis sections and chart-inclusive PDFs.
- Reduced aggressive auto-refresh patterns and moved dashboards/pages to controlled refresh behavior.

## 7. Error Handling
- `GlobalExceptionHandler` maps custom exceptions: `ResourceNotFoundException` (404), `DuplicateApplicationException`, `EligibilityNotMetException`, `InvalidDriveStateException`, `ProfileLockedException` (400), generic (500). Error shape: `timestamp`, `message`, `details`.

## 8. Running Locally
- From `backend/`:
  ```
  mvnw.cmd spring-boot:run
  ```
- Use query params to mock identity if JWT not wired: `?email=student@example.com`, `?facultyEmail=hod.cse@college.edu`.

## 9. Known Gaps / Follow-ups
- Verify `offers` entity/table alignment (implied by DTOs; add migration/DDL if missing).
- Ensure JWT/security filter chain is enabled in production; remove `?email` shortcuts.
- Consider adding OpenAPI generation and Postman collection sync.
- Add tests for stage transition guards, eligibility edge cases, and profile lock flows.
