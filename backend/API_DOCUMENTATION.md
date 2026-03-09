# CampusHire API Documentation

> Monolithic Spring Boot backend exposing RESTful APIs for Students, Faculty, and Admins. All responses are wrapped in `ApiResponse<T>` with fields `success`, `message`, `data`, `timestamp`.

## Conventions
- Base URL: `/api`
- Auth: JWT is expected (mocked via `?email=` / `?facultyEmail=` on many endpoints for local testing).
- IDs: `Long` unless stated otherwise.
- Date/Time: ISO-8601 strings.

---
## Student Module
- **POST** `/api/student/auth/register?universityRegNo=REG123` — body `AuthRequestDto{email,password}` → register student.
- **POST** `/api/student/auth/login` — body `AuthRequestDto{email,password}` → returns `AuthResponseDto{token,role,email}`.
- **GET** `/api/student/profile?email=` → `StudentProfileDto` (personal, contact, academic, schooling).
- **GET** `/api/student/profile/verification-status?email=` → string status (`PENDING|VERIFIED|REJECTED`).
- **PUT** `/api/student/profile/personal?email=` — body `StudentProfileDto.PersonalDetailsDto` → update personal.
- **PUT** `/api/student/profile/contact?email=` — body `StudentProfileDto.ContactDetailsDto` → update contact.
- **PUT** `/api/student/profile/academic?email=` — body `StudentProfileDto.AcademicRecordDto` → update academics.
- **PUT** `/api/student/profile/schooling?email=` — body `StudentProfileDto.SchoolingDetailsDto` → update schooling.
- **GET** `/api/student/drives?email=` → list `PlacementDriveDto` with eligibility flag.
- **GET** `/api/student/drives/{driveId}?email=` → drive details.
- **POST** `/api/student/applications/{driveId}/apply?email=` → apply to drive.
- **GET** `/api/student/applications?email=` → list `DriveApplicationDto` (stage/status per drive).
- **GET** `/api/student/dashboard/stats` → map of metrics (companies, ongoing drives, highest CTC).
- **GET** `/api/student/info/companies` → list `Company`.
- **GET** `/api/student/info/announcements` → list `Announcement`.
- **GET** `/api/student/info/events` → list `Event`.

## Faculty Module (department-scoped; uses `?facultyEmail=` defaulted for dev)
- **GET** `/api/faculty/students?status=VERIFIED|PENDING&facultyEmail=` → list `FacultyStudentDTO` in department.
- **GET** `/api/faculty/students/{id}?facultyEmail=` → single student profile view.
- **POST** `/api/faculty/students/{id}/verify?facultyEmail=` — body `ProfileVerificationRequestDTO{status,remarks}` → approve/reject.
- **GET** `/api/faculty/students/verification-history?facultyEmail=` → list `ProfileVerification` history.
- **GET** `/api/faculty/drives?statuses=ONGOING&facultyEmail=` → list `FacultyDriveDTO` for department.
- **GET** `/api/faculty/drives/{driveId}/participants?facultyEmail=` → list `FacultyApplicationDTO` for a drive.
- **GET** `/api/faculty/applications?facultyEmail=` → list dept applications.
- **PUT** `/api/faculty/applications/{id}/stage?facultyEmail=` — body `StageUpdateRequestDTO{stage}` → advance stage (APPLIED→ASSESSMENT→TECHNICAL→HR).
- **GET** `/api/faculty/analytics?facultyEmail=` → `FacultyAnalyticsDTO` (top recruiters, avg package, placement % for dept).
- **GET** `/api/faculty/dashboard/stats?facultyEmail=` → `FacultyDashboardStatsDTO`.
- **GET** `/api/faculty/announcements?facultyEmail=` → dept announcements.
- **POST** `/api/faculty/announcements?facultyEmail=` — body `Announcement` → create dept announcement.
- **DELETE** `/api/faculty/announcements/{id}?facultyEmail=` → delete dept announcement.
- **GET** `/api/faculty/events?facultyEmail=` → dept events.
- **POST** `/api/faculty/events?facultyEmail=` — body `Event` → create dept event.
- **DELETE** `/api/faculty/events/{id}?facultyEmail=` → delete dept event.

## Admin Module (placement office)
- **POST** `/api/admin/companies` — body `CompanyRequestDTO` → create company.
- **PUT** `/api/admin/companies/{companyId}` — body `CompanyRequestDTO` → update.
- **GET** `/api/admin/companies` → list companies.
- **GET** `/api/admin/companies/{companyId}` → company by id.
- **POST** `/api/admin/drives` — body `PlacementDriveRequestDTO` → create drive.
- **PUT** `/api/admin/drives/{driveId}` — body `PlacementDriveRequestDTO` → update drive.
- **PATCH** `/api/admin/drives/{driveId}/status?status=UPCOMING|ONGOING|COMPLETED` → change status.
- **GET** `/api/admin/drives` → list drives.
- **GET** `/api/admin/drives/{driveId}` → drive by id.
- **POST** `/api/admin/drives/{driveId}/eligibility` — body `EligibilityCriteriaDTO` → set criteria.
- **GET** `/api/admin/drives/{driveId}/eligibility` → get criteria.
- **GET** `/api/admin/drives/{driveId}/shortlist/eligible` → eligible applicants list.
- **POST** `/api/admin/drives/{driveId}/shortlist/generate?email=` — body `ShortlistRequestDTO` → generate shortlist (audited).
- **GET** `/api/admin/drives/{driveId}/participation` → `ParticipationStatsDTO` (applied/eligible counts).
- **POST** `/api/admin/drives/{driveId}/placements/offers?email=` — body `OfferRequestDTO{studentId,ctcLpa,role}` → record offer (locks profile, marks selected).
- **GET** `/api/admin/drives/{driveId}/placements/offers` → list offers for drive.
- **PATCH** `/api/admin/drives/{driveId}/placements/complete?email=` → mark drive completed.
- **GET** `/api/admin/export/students?email=` → CSV of verified students.
- **GET** `/api/admin/export/drives/{driveId}/results?email=` → CSV of drive results.
- **GET** `/api/admin/dashboard/stats` → `DashboardStatsDTO` (totals, verified, placed, active drives).
- **GET** `/api/admin/analytics/placements` → `AnalyticsResponseDTO` (macro placement analytics).
- **GET** `/api/admin/students/search?query=` → list `AdminStudentProfileDTO` (verified students search).
- **GET** `/api/admin/students/{studentId}` → `AdminStudentProfileDTO` by id.
- **PATCH** `/api/admin/students/{studentId}/toggle-lock?email=` → lock/unlock profile.
- **GET** `/api/admin/announcements` → list announcements.
- **POST** `/api/admin/announcements?email=` — body `AnnouncementRequestDTO` → create announcement.
- **DELETE** `/api/admin/announcements/{id}?email=` → delete announcement.
- **GET** `/api/admin/audit?query=` → list `AuditLogDTO` (actions captured by AOP).

## Common DTO Highlights (fields abridged)
- `AuthRequestDto`: `email`, `password`.
- `AuthResponseDto`: `token`, `role`, `email`.
- `PlacementDriveRequestDTO`: `companyId`, `title`, `role`, `ctcLpa`, `description`, `registrationDeadline`, etc.
- `EligibilityCriteriaDTO`: `minCgpa`, `minXPercentage`, `minXiIPercentage`, `maxStandingArrears`, `maxHistoryOfArrears`, `allowedDepartmentIds`.
- `DriveApplicationDto`: `id`, `driveId`, `driveTitle`, `stage`, `status`, `appliedAt`.
- `StudentProfileDto`: nested `personal`, `contact`, `academic`, `schooling`; `verificationStatus`, `isLocked`.

## Error Handling
- Custom exceptions mapped by `GlobalExceptionHandler`: `ResourceNotFoundException` → 404, `DuplicateApplicationException` → 400, `EligibilityNotMetException` → 400, `InvalidDriveStateException` → 400, `ProfileLockedException` → 400; generic → 500. Error body includes `timestamp`, `message`, `details`.

## Security & Audit
- Many admin/faculty endpoints annotated with `@AuditAction` (intercepted by `AdminAuditAspect`) writing to `audit_logs` table.
- Student endpoints may accept `?email=` as a mock principal; in production use JWT `Authorization: Bearer <token>`.

## Quick Start (local testing)
1) Run backend: `mvnw.cmd spring-boot:run` from `backend/`. 2) Use `?email=student@example.com` or `?facultyEmail=hod.cse@college.edu` on secured routes if JWT not configured.
