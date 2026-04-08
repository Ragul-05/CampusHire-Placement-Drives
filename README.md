<div align="center">

# 🎓 VCET CampusHire
### AI Powered Placement Management Platform

[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.x-6DB33F?style=for-the-badge&logo=springboot&logoColor=white)](https://spring.io/projects/spring-boot)
[![React](https://img.shields.io/badge/React-18.x-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactjs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-336791?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Java](https://img.shields.io/badge/Java-21-ED8B00?style=for-the-badge&logo=openjdk&logoColor=white)](https://openjdk.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![JWT](https://img.shields.io/badge/JWT-Auth-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white)](https://jwt.io/)
[![Vite](https://img.shields.io/badge/Vite-5.x-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](LICENSE)

> **A complete, role-based placement automation platform built for engineering colleges to streamline the entire campus recruitment lifecycle — from student onboarding to final offer recording.**

[📖 API Docs](#-backend-api-documentation) • [🚀 Quick Start](#-installation--setup-guide) • [🏗️ Architecture](#-system-architecture) • [📊 Database](#-database-design) • [🔐 Security](#-security-implementation)

</div>

---

## 📋 Table of Contents

1. [Project Overview](#-project-overview)
2. [System Architecture](#-system-architecture)
3. [Technology Stack](#-technology-stack)
4. [Roles & Responsibilities](#-roles--responsibilities)
5. [Database Design](#-database-design)
6. [Backend API Documentation](#-backend-api-documentation)
7. [Workflow Explanation](#-workflow-explanation)
8. [Frontend Project Structure](#-frontend-project-structure)
9. [Frontend Logic Flow](#-frontend-logic-flow)
10. [Frontend Routing Structure](#-frontend-routing-structure)
11. [NPM Packages Used](#-npm-packages-used)
12. [Export System](#-export-system)
13. [Security Implementation](#-security-implementation)
14. [UI Design System](#-ui-design-system)
15. [Installation & Setup Guide](#-installation--setup-guide)
16. [Environment Configuration](#-environment-configuration)
17. [Future Improvements](#-future-improvements)
18. [Contributing](#-contributing)

---

## 🎯 Project Overview

**VCET CampusHire** is a full-stack, role-based placement automation platform engineered specifically for VCET (Velammal College of Engineering and Technology) and adaptable to any engineering institution. It replaces the fragmented, spreadsheet-driven campus recruitment workflow with a unified, intelligent digital platform.

### 🌟 Core Capabilities

| Capability | Description |
|---|---|
| **Student Onboarding** | Self-registration with university registration number, profile building across 8 sections |
| **Profile Verification** | Faculty-driven multi-stage verification with approval/rejection remarks |
| **Drive Management** | Placement Head creates and manages company drives with detailed eligibility criteria |
| **Smart Eligibility Filtering** | Automated filtering of eligible students based on CGPA, arrears, skills, and department |
| **Application Tracking** | Full pipeline tracking from APPLIED → ASSESSMENT → TECHNICAL → HR → SELECTED/REJECTED |
| **Offer Recording** | Digital issuance of placement offers with CTC, role, and timestamp |
| **Analytics Dashboard** | Real-time placement statistics, department-wise charts, and trend analysis |
| **Data Export** | CSV/PDF/Excel export of student lists and drive results for reporting |
| **Audit Logging** | Complete audit trail of every admin and faculty action with AOP-based logging |
| **Announcements & Events** | Role-scoped announcement broadcasting and event management |

### 🔄 High-Level System Flow

```
Student Registers → Completes Profile (8 sections) → Faculty Verifies Profile
       ↓
Profile Status: PENDING → VERIFIED / REJECTED
       ↓
Placement Head Creates Drive → Sets Eligibility Criteria
       ↓
Students Apply for Drives → Faculty Filters Eligible Candidates
       ↓
Stage Progression: APPLIED → ASSESSMENT → TECHNICAL → HR → SELECTED
       ↓
Placement Head Records Offer → Student Profile Locked → Drive Completed
```

### 🆕 Recent Updates (Apr 2026)

- Added a dedicated **Placement Results** experience for both Admin and Faculty with:
  - Summary KPIs (total/placed/unplaced/placement %)
  - Placed vs Unplaced table
  - Company-wise round analysis
  - Student round tracking with filters/search
- Added role-aware unified backend endpoint: **`GET /api/placement-results`**.
  - Admin and Faculty now read through the same placement-results flow for consistency.
- Added faculty-specific activity logs endpoint: **`GET /api/faculty/audit`**.
- Standardized stage update flow with shared endpoint: **`PUT /api/stage/update`**.
- Stage model now includes **REJECTED** and UI stage color coding is standardized.
- Export system enhanced:
  - PDF includes chart snapshots and aligned tabular sections
  - Excel includes placement + company-round data sections
- Refresh behavior is now controlled (manual refresh + reduced polling frequency), and placement results tables support smoother pagination transitions.

---

## 🏗️ System Architecture

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND LAYER                          │
│                  React 18 + TypeScript + Vite                   │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐ │
│  │  Student UI  │  │ Faculty UI  │  │  Placement Head (Admin)  │ │
│  │  Dashboard   │  │  Dashboard  │  │        Dashboard         │ │
│  └──────┬──────┘  └──────┬──────┘  └───────────┬─────────────┘ │
│         └────────────────┼──────────────────────┘               │
│                          │  Axios HTTP Requests + JWT            │
└──────────────────────────┼──────────────────────────────────────┘
                           │
          ┌────────────────▼────────────────┐
          │        NGINX / Reverse Proxy     │
          │     (Production Deployment)      │
          └────────────────┬────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────────┐
│                        BACKEND LAYER                             │
│              Spring Boot 3.x | Java 21 | Port 8081              │
│                                                                  │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌──────────┐  │
│  │   Auth     │  │  Student   │  │  Faculty   │  │  Admin   │  │
│  │Controllers │  │Controllers │  │Controllers │  │Controllers│  │
│  └────────────┘  └────────────┘  └────────────┘  └──────────┘  │
│         │               │               │               │        │
│  ┌──────▼───────────────▼───────────────▼───────────────▼─────┐ │
│  │                    Service Layer                             │ │
│  │    Business Logic | Eligibility Engine | AOP Audit Logging  │ │
│  └──────────────────────────┬──────────────────────────────────┘ │
│                             │                                    │
│  ┌──────────────────────────▼──────────────────────────────────┐ │
│  │         Spring Security + JWT Filter Chain                   │ │
│  │    Role-Based Access Control (STUDENT / FACULTY /            │ │
│  │                   PLACEMENT_HEAD)                            │ │
│  └──────────────────────────┬──────────────────────────────────┘ │
│                             │                                    │
│  ┌──────────────────────────▼──────────────────────────────────┐ │
│  │              JPA / Hibernate ORM Layer                       │ │
│  │              Spring Data JPA Repositories                    │ │
│  └──────────────────────────┬──────────────────────────────────┘ │
└─────────────────────────────┼────────────────────────────────────┘
                              │
          ┌───────────────────▼──────────────────┐
          │         PostgreSQL Database           │
          │     CampusHireDB | Port 5432          │
          │   22 Tables | Normalized Schema       │
          └──────────────────────────────────────┘
```

### Component Interaction

```
┌──────────────┐    JWT Token     ┌──────────────────────┐
│   Browser    │ ◄──────────────► │  Spring Boot REST    │
│  React SPA   │   API Requests   │  API Server :8081    │
│  :5173 (dev) │                  │                      │
└──────────────┘                  └──────────┬───────────┘
                                             │
                                   ┌─────────▼──────────┐
                                   │   PostgreSQL DB     │
                                   │   :5432             │
                                   │   CampusHireDB      │
                                   └────────────────────┘
```

---

## 💻 Technology Stack

### Backend

| Technology | Version | Purpose |
|---|---|---|
| **Java** | 21 (LTS) | Core programming language |
| **Spring Boot** | 3.x | Application framework, auto-configuration |
| **Spring Security** | 6.x | Authentication, authorization, filter chain |
| **Spring Data JPA** | 3.x | ORM abstraction, repository pattern |
| **Hibernate** | 6.x | JPA implementation, DDL generation |
| **PostgreSQL** | 15+ | Primary relational database |
| **JWT (jjwt)** | 0.11+ | Stateless authentication tokens |
| **Lombok** | 1.18+ | Boilerplate code reduction (`@Data`, `@Builder`) |
| **Maven** | 3.9+ | Build tool, dependency management |
| **Bean Validation** | Jakarta | Request body validation (`@Valid`, `@NotNull`) |

### Frontend

| Technology | Version | Purpose |
|---|---|---|
| **React** | 18.3 | UI component library |
| **TypeScript** | 5.4 | Type-safe JavaScript |
| **Vite** | 5.2 | Build tool, dev server (HMR) |
| **React Router DOM** | 7.x | Client-side routing |
| **Recharts** | 2.12 | Data visualization, analytics charts |
| **Lucide React** | 0.453 | Clean, consistent SVG icon library |
| **jsPDF** | 4.2 | Client-side PDF generation |
| **jspdf-autotable** | 5.0 | PDF table plugin for jsPDF |
| **xlsx** | 0.18 | Excel (.xlsx) file generation |

---

## 👥 Roles & Responsibilities

The system implements three distinct roles with strict access control:

### 🎓 STUDENT Role

```
Permissions:
  ✅ Register with university registration number
  ✅ Login and manage own profile (8 sections)
  ✅ View profile verification status
  ✅ Browse available placement drives
  ✅ Apply for eligible drives
  ✅ Track application stage progression
  ✅ View received offers
  ✅ Read announcements and events

Restrictions:
  ❌ Cannot view other students' profiles
  ❌ Cannot modify profile after it is locked
  ❌ Cannot create or modify drives
  ❌ Cannot access faculty or admin panels
```

### 👨‍🏫 FACULTY Role

```
Permissions:
  ✅ Login to faculty dashboard
  ✅ View all students in own department
  ✅ Verify or reject student profiles with remarks
  ✅ View verification history
  ✅ See active placement drives for department
  ✅ Filter eligible students for specific drives (eligibility engine)
  ✅ Manage application stage progression
  ✅ View department-level analytics
  ✅ Create/manage department announcements and events
  ✅ Export department drive reports

Restrictions:
  ❌ Cannot create or delete placement drives
  ❌ Cannot access other departments' student data
  ❌ Cannot record or modify offers
  ❌ Cannot access the admin panel
```

### 🏢 PLACEMENT_HEAD (Admin) Role

```
Permissions:
  ✅ Full system access
  ✅ Manage companies (CRUD)
  ✅ Create and manage placement drives
  ✅ Set eligibility criteria per drive
  ✅ View and search all verified students
  ✅ Lock / unlock student profiles
  ✅ Generate shortlists for drives
  ✅ Record placement offers
  ✅ Mark drives as completed
  ✅ View system-wide analytics
  ✅ Create/delete announcements and events
  ✅ View complete audit logs
  ✅ Export student and drive data as CSV

Restrictions:
  ❌ Cannot modify student profile content directly
```

---

## 🗄️ Database Design

The system uses a normalized PostgreSQL schema with **22 tables** organized into logical domains.

### Entity Relationship Overview

```
users
  ├── student_profiles (1:1)
  │     ├── student_personal_details   (1:1)
  │     ├── student_contact_details    (1:1)
  │     ├── student_identity_docs      (1:1)
  │     ├── academic_records           (1:1)
  │     ├── schooling_details          (1:1)
  │     ├── student_professional_profiles (1:1)
  │     ├── student_certifications     (1:N)
  │     └── student_skills             (1:N)
  └── departments (N:1)

companies
  └── placement_drives (N:1)
        ├── drive_eligibility (1:1)
        │     ├── drive_required_skills    (1:N element collection)
        │     └── drive_allowed_departments (N:N junction)
        ├── drive_applications (1:N) ←→ student_profiles (N:1)
        └── offers             (1:N) ←→ student_profiles (N:1)

profile_verifications  ← student_profiles + users (faculty)
announcements          ← users (created_by) + departments
events
audit_logs             ← users (actor)
```

---

### Table 1: `users`

**Purpose:** Central authentication and identity table for all system users (students, faculty, placement head).

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | BIGINT | PK, AUTO | Unique user identifier |
| `email` | VARCHAR | UNIQUE, NOT NULL | Login email address |
| `university_reg_no` | VARCHAR | UNIQUE, NOT NULL | Primary universal identifier (e.g., `22CSE001`) |
| `password_hash` | VARCHAR | NOT NULL | BCrypt-hashed password |
| `role` | ENUM | NOT NULL | `STUDENT`, `FACULTY`, `PLACEMENT_HEAD` |
| `department_id` | BIGINT | FK → departments | User's department |
| `is_active` | BOOLEAN | | Account active/inactive flag |

---

### Table 2: `departments`

**Purpose:** Academic department reference table used to scope data access for faculty and drive eligibility.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | BIGINT | PK, AUTO | Unique department identifier |
| `name` | VARCHAR | UNIQUE, NOT NULL | Full name (e.g., `Computer Science Engineering`) |
| `code` | VARCHAR | UNIQUE, NOT NULL | Short code (e.g., `CSE`, `ECE`, `MECH`) |

---

### Table 3: `student_profiles`

**Purpose:** Core student record linking user authentication to all academic and placement data.

| Column | Type | Description |
|---|---|---|
| `id` | BIGINT | PK, AUTO |
| `user_id` | BIGINT | FK → users (1:1, UNIQUE) |
| `roll_no` | VARCHAR | College roll number |
| `batch` | VARCHAR | Academic batch (e.g., `2022-2026`) |
| `resume_url` | VARCHAR | URL to uploaded resume file |
| `resume_file_name` | VARCHAR | Original filename of resume |
| `resume_uploaded_at` | TIMESTAMP | Upload timestamp |
| `resume_summary` | TEXT | Career objective / summary |
| `verification_status` | ENUM | `PENDING`, `VERIFIED`, `REJECTED` |
| `is_locked` | BOOLEAN | Profile lock after placement |
| `is_eligible_for_placements` | BOOLEAN | Placement eligibility flag |
| `interested_on_placement` | BOOLEAN | Student's own interest flag |
| `is_placed` | BOOLEAN | Final placement status |
| `number_of_offers` | INT | Total offers received |
| `offer1` .. `offer4` | VARCHAR | Offer company names |
| `opted_offer` | VARCHAR | Final opted company |
| `highest_package_lpa` | DOUBLE | Highest package in LPA |

---

### Table 4: `student_personal_details`

**Purpose:** Demographic and family information of the student.

| Column | Type | Description |
|---|---|---|
| `id` | BIGINT | PK, maps to `student_profiles.id` |
| `first_name` | VARCHAR | Student's first name |
| `last_name` | VARCHAR | Student's last name |
| `father_name` | VARCHAR | Father's full name |
| `mother_name` | VARCHAR | Mother's full name |
| `father_occupation` | VARCHAR | Father's occupation |
| `mother_occupation` | VARCHAR | Mother's occupation |
| `gender` | VARCHAR | Gender |
| `community` | VARCHAR | Category (OC / BC / MBC / SC / ST) |
| `date_of_birth` | DATE | Date of birth |
| `hosteler_or_day_scholar` | VARCHAR | Accommodation type |
| `bio` | TEXT | Personal bio / career objective |

---

### Table 5: `student_contact_details`

**Purpose:** Contact and address information of the student.

| Column | Type | Description |
|---|---|---|
| `id` | BIGINT | PK, maps to `student_profiles.id` |
| `alternate_email` | VARCHAR | Secondary email address |
| `student_mobile1` | VARCHAR | Primary mobile number |
| `student_mobile2` | VARCHAR | Secondary mobile number |
| `parent_mobile` | VARCHAR | Parent/guardian contact number |
| `landline_no` | VARCHAR | Landline number |
| `full_address` | VARCHAR(500) | Complete residential address |
| `city` | VARCHAR | City |
| `state` | VARCHAR | State |
| `pincode` | VARCHAR | PIN code |

---

### Table 6: `student_identity_docs`

**Purpose:** Government identity document details for KYC verification.

| Column | Type | Description |
|---|---|---|
| `id` | BIGINT | PK, maps to `student_profiles.id` |
| `is_aadhar_available` | BOOLEAN | Aadhar card availability |
| `aadhar_number` | VARCHAR (UNIQUE) | Aadhar number |
| `name_as_per_aadhar` | VARCHAR | Name as per Aadhar card |
| `family_card_number` | VARCHAR | Family ration card number |
| `is_pan_card_available` | BOOLEAN | PAN card availability flag |
| `is_passport_available` | BOOLEAN | Passport availability flag |

---

### Table 7: `academic_records`

**Purpose:** UG academic performance — semester GPAs, arrears, and CGPA used by the eligibility engine.

| Column | Type | Description |
|---|---|---|
| `id` | BIGINT | PK, maps to `student_profiles.id` |
| `ug_year_of_pass` | INT | Expected graduation year |
| `admission_quota` | VARCHAR | Management / Government |
| `medium_of_instruction` | VARCHAR | English / Tamil |
| `locality` | VARCHAR | Rural / Urban |
| `sem1_gpa` .. `sem8_gpa` | DOUBLE | Semester-wise GPA values |
| `cgpa` | DOUBLE | **Indexed** — used by eligibility engine |
| `standing_arrears` | INT | Current active backlogs |
| `history_of_arrears` | INT | Total historical arrears count |
| `has_history_of_arrears` | BOOLEAN | Arrear history boolean flag |
| `course_gap_in_years` | INT | Academic gap years |

---

### Table 8: `schooling_details`

**Purpose:** 10th and 12th standard academic performance data.

| Column | Type | Description |
|---|---|---|
| `id` | BIGINT | PK, maps to `student_profiles.id` |
| `x_marks_percentage` | DOUBLE | 10th standard percentage |
| `x_year_of_passing` | INT | 10th passing year |
| `x_school_name` | VARCHAR | 10th school name |
| `x_board_of_study` | VARCHAR | CBSE / State Board / ICSE |
| `xii_marks_percentage` | DOUBLE | 12th standard percentage |
| `xii_year_of_passing` | INT | 12th passing year |
| `xii_school_name` | VARCHAR | 12th school name |
| `xii_board_of_study` | VARCHAR | Board of study |
| `xii_cut_off_marks` | DOUBLE | 12th cut-off marks |
| `diploma_marks_percentage` | DOUBLE | Diploma percentage (if applicable) |

---

### Table 9: `student_professional_profiles`

**Purpose:** Online presence, portfolio links, and competitive programming statistics.

| Column | Type | Description |
|---|---|---|
| `id` | BIGINT | PK, maps to `student_profiles.id` |
| `linkedin_profile_url` | VARCHAR | LinkedIn profile URL |
| `github_profile_url` | VARCHAR | GitHub profile URL |
| `portfolio_url` | VARCHAR | Personal portfolio website |
| `leetcode_profile_url` | VARCHAR | LeetCode profile URL |
| `leetcode_problems_solved` | INT | Problems solved count |
| `leetcode_rating` | VARCHAR | Contest rating |
| `hackerrank_profile_url` | VARCHAR | HackerRank URL |
| `codechef_profile_url` | VARCHAR | CodeChef URL |
| `codeforces_profile_url` | VARCHAR | Codeforces URL |

---

### Table 10: `student_certifications`

**Purpose:** Professional certifications and online course completions.

| Column | Type | Description |
|---|---|---|
| `id` | BIGINT | PK, AUTO |
| `student_id` | BIGINT | FK → student_profiles |
| `skill_name` | VARCHAR | Skill/course name (e.g., `Python, IoT 4.0`) |
| `duration` | VARCHAR | Course duration (e.g., `12 weeks`) |
| `vendor` | VARCHAR | Issuing body (e.g., `NPTEL`, `Coursera`) |

---

### Table 11: `student_skills`

**Purpose:** Technical and soft skills of the student, matched against drive required skills.

| Column | Type | Description |
|---|---|---|
| `id` | BIGINT | PK, AUTO |
| `student_id` | BIGINT | FK → student_profiles |
| `skill_name` | VARCHAR | Skill name (e.g., `Java`, `React`, `SQL`) |
| `proficiency_level` | VARCHAR | Beginner / Intermediate / Advanced |

---

### Table 12: `placement_drives`

**Purpose:** Core table representing a company's campus recruitment visit.

| Column | Type | Description |
|---|---|---|
| `id` | BIGINT | PK, AUTO |
| `company_id` | BIGINT | FK → companies |
| `title` | VARCHAR | Drive title (e.g., `TCS NQT 2025`) |
| `role` | VARCHAR | Job role offered |
| `ctc_lpa` | DOUBLE | CTC in Lakhs Per Annum |
| `description` | TEXT | Drive description and process details |
| `status` | ENUM | `UPCOMING`, `ONGOING`, `COMPLETED` |
| `created_at` | TIMESTAMP | Auto-populated creation timestamp |
| `application_deadline` | TIMESTAMP | Last date to apply |
| `total_openings` | INT | Number of available positions |

---

### Table 13: `drive_eligibility`

**Purpose:** Eligibility criteria for a drive used by the automated student filtering engine.

| Column | Type | Description |
|---|---|---|
| `drive_id` | BIGINT | PK + FK → placement_drives (1:1) |
| `min_cgpa` | DOUBLE | Minimum CGPA required |
| `min_x_marks` | DOUBLE | Minimum 10th percentage |
| `min_xii_marks` | DOUBLE | Minimum 12th percentage |
| `max_standing_arrears` | INT | Maximum active backlogs allowed |
| `max_history_of_arrears` | INT | Maximum total historical arrears |
| `graduation_year` | INT | Target graduation year batch |

---

### Table 14: `drive_required_skills`

**Purpose:** Skills required for a specific drive (element collection joined to `drive_eligibility`).

| Column | Type | Description |
|---|---|---|
| `drive_id` | BIGINT | FK → drive_eligibility |
| `skill` | VARCHAR | Required skill name |

---

### Table 15: `drive_allowed_departments`

**Purpose:** Many-to-many junction table linking drives to eligible departments.

| Column | Type | Description |
|---|---|---|
| `drive_id` | BIGINT | FK → drive_eligibility |
| `department_id` | BIGINT | FK → departments |

---

### Table 16: `drive_applications`

**Purpose:** Student applications to placement drives with full stage tracking.

| Column | Type | Description |
|---|---|---|
| `id` | BIGINT | PK, AUTO |
| `student_id` | BIGINT | FK → student_profiles |
| `drive_id` | BIGINT | FK → placement_drives |
| `stage` | ENUM | `APPLIED`, `ASSESSMENT`, `TECHNICAL`, `HR`, `SELECTED`, `REJECTED` |
| `applied_at` | TIMESTAMP | Application submission timestamp |
| `last_updated_at` | TIMESTAMP | Stage update timestamp |
| `last_updated_by` | BIGINT | FK → users (faculty/admin who updated stage) |

---

### Table 17: `offers`

**Purpose:** Final placement offers issued to selected students.

| Column | Type | Description |
|---|---|---|
| `id` | BIGINT | PK, AUTO |
| `student_id` | BIGINT | FK → student_profiles |
| `drive_id` | BIGINT | FK → placement_drives |
| `ctc` | DOUBLE | Offered CTC in LPA |
| `role` | VARCHAR | Designated job role |
| `issued_at` | TIMESTAMP | Offer issuance timestamp |

---

### Table 18: `profile_verifications`

**Purpose:** Audit record of every student profile verification action taken by faculty.

| Column | Type | Description |
|---|---|---|
| `id` | BIGINT | PK, AUTO |
| `student_profile_id` | BIGINT | FK → student_profiles |
| `faculty_id` | BIGINT | FK → users (the verifying faculty) |
| `status` | ENUM | `PENDING`, `VERIFIED`, `REJECTED` |
| `remarks` | VARCHAR(1000) | Rejection reason or approval notes |
| `verified_at` | TIMESTAMP | Verification action timestamp |

---

### Table 19: `announcements`

**Purpose:** System-wide or department-scoped announcements from admin/faculty.

| Column | Type | Description |
|---|---|---|
| `id` | BIGINT | PK, AUTO |
| `title` | VARCHAR | Announcement title |
| `content` | TEXT | Full announcement content |
| `scope` | ENUM | `ALL`, `DEPARTMENT`, `STUDENT_ONLY` |
| `department_id` | BIGINT | FK → departments (optional, for scoped) |
| `created_by` | BIGINT | FK → users |
| `created_at` | TIMESTAMP | Creation timestamp |

---

### Table 20: `events`

**Purpose:** Academic and placement-related event listings visible to students and faculty.

| Column | Type | Description |
|---|---|---|
| `id` | BIGINT | PK, AUTO |
| `title` | VARCHAR | Event title |
| `description` | TEXT | Event details |
| `event_date` | TIMESTAMP | Scheduled date and time |
| `location` | VARCHAR | Venue or online meeting link |
| `created_by` | BIGINT | FK → users |

---

### Table 21: `audit_logs`

**Purpose:** Immutable audit trail of every significant action by admin and faculty. Auto-populated via Spring AOP.

| Column | Type | Description |
|---|---|---|
| `id` | BIGINT | PK, AUTO |
| `user_id` | BIGINT | FK → users (the actor) |
| `action` | VARCHAR | Action code (e.g., `CREATE_DRIVE`, `LOCK_PROFILE`) |
| `target_entity` | VARCHAR | Entity type affected (e.g., `PlacementDrive`) |
| `target_entity_id` | BIGINT | ID of the affected entity |
| `details` | TEXT | JSON snapshot of the change |
| `timestamp` | TIMESTAMP | When the action occurred |
| `ip_address` | VARCHAR | Actor's IP address |

---

### Table 22: `companies`

**Purpose:** Company master data — referenced when creating placement drives.

| Column | Type | Description |
|---|---|---|
| `id` | BIGINT | PK, AUTO |
| `name` | VARCHAR (UNIQUE) | Company name |
| `website` | VARCHAR | Company website URL |
| `industry` | VARCHAR | Industry sector |
| `visit_history` | TEXT | Notes on previous campus visits |
| `created_at` | TIMESTAMP | Auto-populated registration timestamp |

---

## 📡 Backend API Documentation

**Base URL:** `http://localhost:8081/api`

**Authentication:** All protected endpoints require:
```
Authorization: Bearer <jwt_token>
```

**Standard Success Response:**
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { }
}
```

**Standard Error Response:**
```json
{
  "success": false,
  "message": "Error description",
  "data": null
}
```

---

### 🔐 AUTH MODULE

#### 1. Faculty / Admin Login
```http
POST /api/auth/login
```
| Field | Type | Required | Description |
|---|---|---|---|
| `email` | string | ✅ | User email |
| `password` | string | ✅ | Account password |

**Request:**
```json
{ "email": "faculty@vcet.ac.in", "password": "SecurePass@123" }
```
**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiJ9...",
    "email": "faculty@vcet.ac.in",
    "role": "FACULTY",
    "universityRegNo": "FAC001"
  }
}
```

---

#### 2. Student Login
```http
POST /api/student/auth/login
```
**Request:**
```json
{ "email": "rahul.k@vcet.ac.in", "password": "MyPass@123" }
```
**Response:** Same structure as above with `"role": "STUDENT"`.

---

#### 3. Student Registration
```http
POST /api/student/auth/register?universityRegNo=22CSE001
```
**Request:**
```json
{ "email": "rahul.k@vcet.ac.in", "password": "SecurePass@123" }
```
**Response:**
```json
{ "success": true, "message": "Student registered successfully", "data": null }
```
**Validation:** `email` unique, `universityRegNo` unique, password ≥ 8 characters.

---

### 👨‍🎓 STUDENT PROFILE MODULE

#### 4. Get Full Student Profile
```http
GET /api/student/profile?email=rahul.k@vcet.ac.in
```
**Response:**
```json
{
  "success": true,
  "message": "Profile fetched successfully",
  "data": {
    "rollNo": "22CSE001",
    "batch": "2022-2026",
    "verificationStatus": "PENDING",
    "isLocked": false,
    "isEligibleForPlacements": false,
    "personalDetails": { "firstName": "Rahul", "lastName": "Kumar", "gender": "Male" },
    "academicRecord": { "cgpa": 8.5, "standingArrears": 0, "historyOfArrears": 0 },
    "skills": [
      { "skillName": "Java", "proficiencyLevel": "Advanced" }
    ]
  }
}
```

---

#### 5. Get Verification Status
```http
GET /api/student/profile/verification-status?email=rahul.k@vcet.ac.in
```
**Response:** `{ "data": "PENDING" }`

---

#### 6. Update Personal Details
```http
PUT /api/student/profile/personal?email=rahul.k@vcet.ac.in
```
```json
{
  "firstName": "Rahul", "lastName": "Kumar",
  "fatherName": "Rajesh Kumar", "motherName": "Priya Kumar",
  "gender": "Male", "community": "BC",
  "dateOfBirth": "2004-05-15",
  "hostelerOrDayScholar": "Hosteler",
  "bio": "Passionate software developer."
}
```

---

#### 7. Update Contact Details
```http
PUT /api/student/profile/contact?email=rahul.k@vcet.ac.in
```
```json
{
  "studentMobile1": "9876543210", "parentMobile": "9876543212",
  "fullAddress": "15, Anna Nagar, Chennai", "city": "Chennai",
  "state": "Tamil Nadu", "pincode": "600040"
}
```

---

#### 8. Update Academic Record
```http
PUT /api/student/profile/academic?email=rahul.k@vcet.ac.in
```
```json
{
  "ugYearOfPass": 2026, "admissionQuota": "Government",
  "sem1Gpa": 8.2, "sem2Gpa": 8.5, "sem3Gpa": 8.7, "sem4Gpa": 9.0,
  "cgpa": 8.63, "standingArrears": 0, "historyOfArrears": 0,
  "hasHistoryOfArrears": false, "courseGapInYears": 0
}
```

---

#### 9. Update Schooling Details
```http
PUT /api/student/profile/schooling?email=rahul.k@vcet.ac.in
```
```json
{
  "xMarksPercentage": 92.5, "xYearOfPassing": 2020,
  "xSchoolName": "Govt. HSS", "xBoardOfStudy": "State Board",
  "xiiMarksPercentage": 87.0, "xiiYearOfPassing": 2022,
  "xiiCutOffMarks": 192.5
}
```

---

#### 10. Update Professional Profile
```http
PUT /api/student/profile/professional?email=rahul.k@vcet.ac.in
```
```json
{
  "linkedinProfileUrl": "https://linkedin.com/in/rahulkumar",
  "githubProfileUrl": "https://github.com/rahulkumar",
  "leetcodeProfileUrl": "https://leetcode.com/rahulkumar",
  "leetcodeProblemsSolved": 350,
  "leetcodeRating": "1800"
}
```

---

#### 11. Update Certifications
```http
PUT /api/student/profile/certifications?email=rahul.k@vcet.ac.in
```
```json
[
  { "skillName": "Python for Data Science", "duration": "12 weeks", "vendor": "NPTEL" },
  { "skillName": "AWS Cloud Practitioner", "duration": "6 months", "vendor": "Amazon" }
]
```

---

#### 12. Update Identity Documents
```http
PUT /api/student/profile/identity?email=rahul.k@vcet.ac.in
```
```json
{
  "isAadharAvailable": true, "aadharNumber": "1234-5678-9012",
  "nameAsPerAadhar": "Rahul Kumar", "isPanCardAvailable": true,
  "isPassportAvailable": false
}
```

---

#### 13. Update Skills
```http
PUT /api/student/profile/skills?email=rahul.k@vcet.ac.in
```
```json
[
  { "skillName": "Java", "proficiencyLevel": "Advanced" },
  { "skillName": "Spring Boot", "proficiencyLevel": "Intermediate" },
  { "skillName": "React", "proficiencyLevel": "Intermediate" }
]
```

---

#### 14. Update Resume
```http
PUT /api/student/profile/resume?email=rahul.k@vcet.ac.in
```
```json
{
  "resumeUrl": "https://storage.vcet.ac.in/resumes/22CSE001_resume.pdf",
  "resumeFileName": "Rahul_Kumar_Resume.pdf",
  "resumeSummary": "Final year CSE student with strong Java and web dev skills."
}
```

---

### 🚗 STUDENT DRIVE MODULE

#### 15. Get Visible Drives
```http
GET /api/student/drives?email=rahul.k@vcet.ac.in
```
**Response:**
```json
{
  "data": [{
    "id": 1, "title": "TCS NQT 2025",
    "companyName": "Tata Consultancy Services",
    "role": "Software Engineer", "ctcLpa": 7.0,
    "status": "UPCOMING",
    "applicationDeadline": "2025-03-15T23:59:00",
    "totalOpenings": 50
  }]
}
```

---

#### 16. Get Drive Details
```http
GET /api/student/drives/{driveId}?email=rahul.k@vcet.ac.in
```
**Response includes** full `eligibilityCriteria` block with `minCgpa`, `requiredSkills`, `allowedDepartments`.

---

### 📝 STUDENT APPLICATION MODULE

#### 17. Apply for Drive
```http
POST /api/student/applications/{driveId}/apply?email=rahul.k@vcet.ac.in
```
**Validation:** Profile must be `VERIFIED`, drive must be `UPCOMING`/`ONGOING`, deadline not passed, no duplicate application.

**Response:** `{ "message": "Successfully applied for the drive" }`

---

#### 18. Get My Applications
```http
GET /api/student/applications?email=rahul.k@vcet.ac.in
```
**Response:**
```json
{
  "data": [{
    "id": 1, "driveName": "TCS NQT 2025",
    "companyName": "Tata Consultancy Services",
    "role": "Software Engineer", "ctcLpa": 7.0,
    "stage": "TECHNICAL",
    "appliedAt": "2025-02-01T10:30:00"
  }]
}
```

---

### 🎁 STUDENT OFFER MODULE

#### 19. Get My Offers
```http
GET /api/student/offers?email=rahul.k@vcet.ac.in
```
**Response:**
```json
{
  "data": [{
    "id": 1, "companyName": "Tata Consultancy Services",
    "role": "Software Engineer", "ctc": 7.0,
    "issuedAt": "2025-03-01T12:00:00"
  }]
}
```

---

### 📢 STUDENT ANNOUNCEMENT MODULE

#### 20. Get Student Announcements
```http
GET /api/student/announcements?email=rahul.k@vcet.ac.in
```

---

#### 21. Get Student Events
```http
GET /api/student/events?email=rahul.k@vcet.ac.in
```

---

#### 22. Get Student Dashboard Stats
```http
GET /api/student/dashboard/stats
```
**Response:**
```json
{
  "data": {
    "totalDrives": 12, "appliedDrives": 3,
    "selectedDrives": 1, "profileStatus": "VERIFIED"
  }
}
```

---

### 👩‍🏫 FACULTY DASHBOARD MODULE

#### 23. Get Faculty Dashboard Stats
```http
GET /api/faculty/dashboard/stats?facultyEmail=prof.sharma@vcet.ac.in
```
**Response:**
```json
{
  "data": {
    "departmentName": "Computer Science Engineering",
    "totalStudents": 120, "pendingVerifications": 15,
    "verifiedStudents": 98, "rejectedStudents": 7,
    "placedStudents": 45, "activeDrives": 3
  }
}
```

---

#### 24. Get Pending Verifications
```http
GET /api/faculty/dashboard/verifications/pending?facultyEmail=prof.sharma@vcet.ac.in
```

---

#### 25. Get Recent Verifications
```http
GET /api/faculty/dashboard/verifications/recent?facultyEmail=prof.sharma@vcet.ac.in
```

---

### 👨‍🏫 FACULTY STUDENT MODULE

#### 26. Get Department Students
```http
GET /api/faculty/students?facultyEmail=prof.sharma@vcet.ac.in&status=PENDING
```
**Query Params:** `status` — optional filter: `PENDING`, `VERIFIED`, `REJECTED`

---

#### 27. Get Student Profile (Faculty View)
```http
GET /api/faculty/students/{id}?facultyEmail=prof.sharma@vcet.ac.in
```

---

#### 28. Verify / Reject Student Profile
```http
POST /api/faculty/students/{id}/verify?facultyEmail=prof.sharma@vcet.ac.in
```
```json
{ "status": "VERIFIED", "remarks": "All documents verified." }
```
```json
{ "status": "REJECTED", "remarks": "10th marksheet is blurry. Please re-upload." }
```

---

#### 29. Get Verification History
```http
GET /api/faculty/students/verification-history?facultyEmail=prof.sharma@vcet.ac.in
```

---

#### 30. Submit Verification (Alternative Endpoint)
```http
POST /api/faculty/verifications/submit?facultyEmail=prof.sharma@vcet.ac.in
```
```json
{ "studentId": 5, "status": "VERIFIED", "remarks": "Approved." }
```

---

### 🔍 FACULTY DRIVE FILTERING MODULE

#### 31. Get Active Drives for Faculty
```http
GET /api/faculty/drives/active?facultyEmail=prof.sharma@vcet.ac.in
```

---

#### 32. Filter Eligible Students for Drive
```http
GET /api/faculty/drives/{driveId}/filter-eligible?facultyEmail=prof.sharma@vcet.ac.in
```
**Response:**
```json
{
  "data": {
    "drive": { "id": 1, "title": "TCS NQT 2025" },
    "totalVerified": 98,
    "eligibleStudents": [
      { "id": 5, "rollNo": "22CSE042", "studentName": "Priya Menon", "cgpa": 8.2 }
    ],
    "ineligibleReasons": {
      "6": ["CGPA below minimum (7.0)", "Standing arrears exceed limit"],
      "9": ["Department not allowed for this drive"]
    }
  }
}
```

---

#### 33. Update Student Stage in Drive
```http
POST /api/faculty/drives/{studentId}/stage?facultyEmail=prof.sharma@vcet.ac.in
```
```json
{ "driveId": 1, "stage": "TECHNICAL" }
```
**Valid Stages:** `APPLIED` → `ASSESSMENT` → `TECHNICAL` → `HR` → `SELECTED` / `REJECTED`

---

### 📋 FACULTY APPLICATION MODULE

#### 34. Get Department Applications
```http
GET /api/faculty/applications?facultyEmail=prof.sharma@vcet.ac.in
```

---

#### 35. Update Application Stage
```http
PUT /api/faculty/applications/{id}/stage?facultyEmail=prof.sharma@vcet.ac.in
```
```json
{ "stage": "HR", "remarks": "Cleared technical round." }
```

---

### 🚗 FACULTY DRIVE MODULE

#### 36. Get Department Drives
```http
GET /api/faculty/drives?facultyEmail=prof.sharma@vcet.ac.in&statuses=UPCOMING,ONGOING
```

---

#### 37. Get Drive Participants
```http
GET /api/faculty/drives/{driveId}/participants?facultyEmail=prof.sharma@vcet.ac.in
```

---

### 📊 FACULTY ANALYTICS MODULE

#### 38. Get Department Analytics
```http
GET /api/faculty/analytics?facultyEmail=prof.sharma@vcet.ac.in
```
**Response:**
```json
{
  "data": {
    "departmentName": "CSE",
    "totalStudents": 120, "placedCount": 45,
    "placementPercentage": 37.5,
    "averageCTC": 6.8, "highestCTC": 24.0,
    "driveParticipation": [
      { "driveTitle": "TCS NQT", "applicants": 85, "selected": 12 }
    ]
  }
}
```

---

### 📢 FACULTY ANNOUNCEMENT MODULE

#### 39. Get Department Announcements
```http
GET /api/faculty/announcements?facultyEmail=prof.sharma@vcet.ac.in
```

---

#### 40. Create Department Announcement
```http
POST /api/faculty/announcements?facultyEmail=prof.sharma@vcet.ac.in
```
```json
{ "title": "Resume Deadline Extended", "content": "...", "scope": "DEPARTMENT" }
```

---

#### 41. Delete Department Announcement
```http
DELETE /api/faculty/announcements/{id}?facultyEmail=prof.sharma@vcet.ac.in
```

---

#### 42. Get Faculty Events
```http
GET /api/faculty/events?facultyEmail=prof.sharma@vcet.ac.in
```

---

### 🏢 ADMIN COMPANY MODULE

#### 43. Create Company
```http
POST /api/admin/companies
```
```json
{
  "name": "Tata Consultancy Services",
  "website": "https://tcs.com",
  "industry": "IT Services",
  "visitHistory": "Visited 2023, 2024. Hired 45 students total."
}
```
**Response:** `{ "id": 1, "name": "Tata Consultancy Services", "createdAt": "..." }`

---

#### 44. Update Company
```http
PUT /api/admin/companies/{companyId}
```

---

#### 45. Get All Companies
```http
GET /api/admin/companies
```

---

#### 46. Get Company by ID
```http
GET /api/admin/companies/{companyId}
```

---

#### 47. Delete Company
```http
DELETE /api/admin/companies/{companyId}
```

---

### 🚗 ADMIN DRIVE MODULE

#### 48. Create Placement Drive
```http
POST /api/admin/drives
```
```json
{
  "companyId": 1,
  "title": "TCS NQT 2025",
  "role": "Software Engineer",
  "ctcLpa": 7.0,
  "description": "TCS National Qualifier Test — 3 rounds.",
  "status": "UPCOMING",
  "applicationDeadline": "2025-03-15T23:59:00",
  "totalOpenings": 50
}
```

---

#### 49. Update Placement Drive
```http
PUT /api/admin/drives/{driveId}
```

---

#### 50. Change Drive Status
```http
PATCH /api/admin/drives/{driveId}/status?status=ONGOING
```
**Valid values:** `UPCOMING`, `ONGOING`, `COMPLETED`

---

#### 51. Get All Drives
```http
GET /api/admin/drives
```

---

#### 52. Get Drive by ID
```http
GET /api/admin/drives/{driveId}
```

---

### 🎯 ADMIN ELIGIBILITY MODULE

#### 53. Set Eligibility Criteria
```http
POST /api/admin/drives/{driveId}/eligibility
```
```json
{
  "minCgpa": 7.0,
  "minXMarks": 60.0,
  "minXiiMarks": 60.0,
  "maxStandingArrears": 0,
  "maxHistoryOfArrears": 2,
  "graduationYear": 2025,
  "requiredSkills": ["Java", "Python", "SQL"],
  "allowedDepartmentIds": [1, 2, 3]
}
```

---

#### 54. Get Eligibility Criteria
```http
GET /api/admin/drives/{driveId}/eligibility
```

---

### 📋 ADMIN SHORTLIST MODULE

#### 55. Get Eligible Applicants
```http
GET /api/admin/drives/{driveId}/shortlist/eligible
```

---

#### 56. Generate Shortlist
```http
POST /api/admin/drives/{driveId}/shortlist/generate
```
```json
{ "topN": 30, "sortBy": "CGPA" }
```

---

### 🏆 ADMIN FINAL PLACEMENT MODULE

#### 57. Record Offer
```http
POST /api/admin/drives/{driveId}/placements/offers
```
```json
{ "studentProfileId": 5, "ctc": 7.0, "role": "Software Engineer" }
```
**Response:**
```json
{
  "data": {
    "studentName": "Priya Menon", "rollNo": "22CSE042",
    "companyName": "TCS", "role": "Software Engineer",
    "ctc": 7.0, "issuedAt": "2025-03-01T12:00:00"
  }
}
```

---

#### 58. Get Offers by Drive
```http
GET /api/admin/drives/{driveId}/placements/offers
```

---

#### 59. Mark Drive Completed
```http
PATCH /api/admin/drives/{driveId}/placements/complete
```

---

### 👩‍🎓 ADMIN STUDENT MODULE

#### 60. Search Verified Students
```http
GET /api/admin/students/search?query=Priya
```

---

#### 61. Get Student by ID
```http
GET /api/admin/students/{studentId}
```

---

#### 62. Toggle Profile Lock
```http
PATCH /api/admin/students/{studentId}/toggle-lock
```
**Response:**
```json
{ "message": "Profile locked successfully", "data": { "isLocked": true } }
```

---

### 📊 ADMIN ANALYTICS MODULE

#### 63. Get Placement Analytics
```http
GET /api/admin/analytics/placements
```
**Response:**
```json
{
  "data": {
    "totalStudents": 480, "totalVerified": 412,
    "totalPlaced": 185, "overallPlacementPercentage": 44.9,
    "highestPackageLpa": 42.0, "averagePackageLpa": 7.8,
    "totalDrives": 18, "activeDrives": 3,
    "departmentWisePlacement": [
      { "department": "CSE", "placed": 72, "total": 120, "percentage": 60.0 },
      { "department": "ECE", "placed": 48, "total": 100, "percentage": 48.0 }
    ],
    "monthlyPlacements": [
      { "month": "Jan 2025", "count": 25 },
      { "month": "Feb 2025", "count": 42 }
    ]
  }
}
```

---

#### 64. Get Admin Dashboard Stats
```http
GET /api/admin/dashboard/stats
```
**Response:**
```json
{
  "data": {
    "totalStudents": 480, "verifiedStudents": 412,
    "pendingVerifications": 45, "totalCompanies": 32,
    "activeDrives": 3, "totalOffers": 185
  }
}
```

---

#### 65. Get Drive Participation Stats
```http
GET /api/admin/drives/{driveId}/participation
```

---

### 📢 ADMIN ANNOUNCEMENT MODULE

#### 66. Create Announcement
```http
POST /api/admin/announcements
```
```json
{
  "title": "Placement Season 2024-25 Begins",
  "content": "The campus placement season officially begins on Jan 15, 2025.",
  "scope": "ALL"
}
```

---

#### 67. Get All Announcements
```http
GET /api/admin/announcements
```

---

#### 68. Delete Announcement
```http
DELETE /api/admin/announcements/{id}
```

---

### 📅 ADMIN EVENTS MODULE

#### 69. Get All Events
```http
GET /api/admin/events
```

---

#### 70. Create Event
```http
POST /api/admin/events
```
```json
{
  "title": "Pre-Placement Talk – Infosys",
  "description": "Infosys HR will brief final-year students.",
  "eventDate": "2025-02-05T10:00:00",
  "location": "Main Auditorium, Block A"
}
```

---

#### 71. Delete Event
```http
DELETE /api/admin/events/{id}
```

---

### 📤 ADMIN EXPORT MODULE

#### 72. Export Verified Students (CSV)
```http
GET /api/admin/export/students?email=admin@vcet.ac.in
```
- **Content-Type:** `text/csv`
- **Filename:** `students.csv`
- **Columns:** `Roll No, Name, Email, Department, CGPA, Batch, Verification Status, Is Placed, Highest Package`

---

#### 73. Export Drive Results (CSV)
```http
GET /api/admin/export/drives/{driveId}/results?email=admin@vcet.ac.in
```
- **Filename:** `drive_{id}_results.csv`
- **Columns:** `Roll No, Name, Department, CGPA, Stage, CTC Offered, Role, Offer Date`

---

### 🔍 ADMIN AUDIT MODULE

#### 74. Get Audit Logs
```http
GET /api/admin/audit?query=CREATE_DRIVE
```
**Response:**
```json
{
  "data": [{
    "id": 1, "actorEmail": "admin@vcet.ac.in",
    "actorRole": "PLACEMENT_HEAD",
    "action": "CREATE_DRIVE",
    "targetEntity": "PlacementDrive", "targetEntityId": 1,
    "details": "{\"title\":\"TCS NQT 2025\",\"ctc\":7.0}",
    "timestamp": "2025-01-20T09:00:00",
    "ipAddress": "192.168.1.100"
  }]
}
```

---

### 🙋 ADMIN PROFILE MODULE

#### 75. Get Admin Profile
```http
GET /api/admin/profile
```
*Requires `PLACEMENT_HEAD` role.*

#### 76. Update Admin Profile
```http
PUT /api/admin/profile
```
```json
{ "name": "Dr. S. Kumar", "phone": "9876543210", "designation": "Placement Officer" }
```

---

## 🔄 Workflow Explanation

### Student Complete Workflow

```
STEP 1 — REGISTRATION
──────────────────────
Visit /student/register
→ POST /api/student/auth/register?universityRegNo=22CSE001
→ Account created with role STUDENT
→ Blank profile created with verificationStatus = PENDING

STEP 2 — LOGIN
──────────────────────
Visit /student/login
→ POST /api/student/auth/login
→ JWT stored in localStorage (key: 'token')
→ Role stored in localStorage (key: 'role')
→ Redirect to /student/dashboard

STEP 3 — PROFILE COMPLETION (8 Sections)
──────────────────────────────────────────
Visit /student/profile
→ Tab 1:  Personal Details   PUT /api/student/profile/personal
→ Tab 2:  Contact Details    PUT /api/student/profile/contact
→ Tab 3:  Academic Record    PUT /api/student/profile/academic
→ Tab 4:  Schooling Details  PUT /api/student/profile/schooling
→ Tab 5:  Professional       PUT /api/student/profile/professional
→ Tab 6:  Certifications     PUT /api/student/profile/certifications
→ Tab 7:  Skills             PUT /api/student/profile/skills
→ Tab 8:  Identity Docs      PUT /api/student/profile/identity
→ Resume URL                 PUT /api/student/profile/resume
→ Profile remains PENDING until faculty action

STEP 4 — VERIFICATION WAIT
──────────────────────────────────────────
Poll: GET /api/student/profile/verification-status
PENDING → VERIFIED  (student becomes eligible)
PENDING → REJECTED  (student sees faculty remarks, must update profile)

STEP 5 — APPLY FOR DRIVES
──────────────────────────────────────────
Visit /student/drives
→ GET /api/student/drives   (filtered by department & status)
→ Review eligibility criteria for each drive
→ POST /api/student/applications/{driveId}/apply
→ Application stage: APPLIED

STEP 6 — TRACK APPLICATIONS
──────────────────────────────────────────
Visit /student/applications
→ GET /api/student/applications
→ Stage pipeline: APPLIED → ASSESSMENT → TECHNICAL → HR
→ Final: SELECTED or REJECTED

STEP 7 — OFFER RECEIVED
──────────────────────────────────────────
Visit /student/offers
→ GET /api/student/offers
→ Profile auto-locked upon placement confirmation
```

---

### Faculty Complete Workflow

```
STEP 1 — LOGIN
→ POST /api/auth/login  |  role = FACULTY
→ Redirect to /faculty/dashboard

STEP 2 — PROFILE VERIFICATION
→ GET /api/faculty/dashboard/verifications/pending
→ Review each student profile in detail modal
→ POST /api/faculty/students/{id}/verify
   VERIFIED: "All documents confirmed."
   REJECTED: "Blurry 10th marksheet — please re-upload."

STEP 3 — DRIVE FILTERING
→ GET /api/faculty/drives/active
→ Select a drive
→ GET /api/faculty/drives/{driveId}/filter-eligible
→ Eligibility engine checks: CGPA, arrears, skills, department
→ Review eligible list + per-student ineligible reasons

STEP 4 — STAGE MANAGEMENT
→ GET /api/faculty/applications
→ PUT /api/faculty/applications/{id}/stage
   Advance stages: ASSESSMENT → TECHNICAL → HR
→ Final outcome set by Placement Head

STEP 5 — ANALYTICS & REPORTING
→ GET /api/faculty/analytics
→ Export department data (PDF / Excel)
```

### Placement Head Complete Workflow

```
STEP 1 — COMPANY MANAGEMENT
→ POST /api/admin/companies     — Add company
→ PUT  /api/admin/companies/{id} — Update details
→ GET  /api/admin/companies     — View all

STEP 2 — CREATE & CONFIGURE DRIVE
→ POST /api/admin/drives               — Create drive
→ POST /api/admin/drives/{id}/eligibility — Set CGPA, arrears, skills, depts
→ PATCH /api/admin/drives/{id}/status  — Change to ONGOING

STEP 3 — MONITOR & SHORTLIST
→ GET /api/admin/drives/{id}/shortlist/eligible  — View qualified students
→ POST /api/admin/drives/{id}/shortlist/generate — Generate ranked shortlist
→ GET /api/admin/drives/{id}/participation       — View participation stats

STEP 4 — RECORD OFFERS & COMPLETE
→ POST  /api/admin/drives/{id}/placements/offers   — Record offer
→ GET   /api/admin/drives/{id}/placements/offers   — View all offers
→ PATCH /api/admin/drives/{id}/placements/complete — Mark completed
→ PATCH /api/admin/students/{id}/toggle-lock       — Lock placed student

STEP 5 — ANALYTICS & COMPLIANCE
→ GET /api/admin/analytics/placements  — Full statistics
→ GET /api/admin/dashboard/stats       — Dashboard KPIs
→ GET /api/admin/audit                 — Audit trail
→ GET /api/admin/export/students       — Export CSV
→ GET /api/admin/export/drives/{id}/results — Export drive CSV
```

---

## 📁 Frontend Project Structure

```
frontend/
├── index.html                      # Vite HTML entry point
├── vite.config.ts                  # Vite configuration
├── tsconfig.json                   # TypeScript config
├── tsconfig.node.json              # Node-specific TS config
├── package.json                    # Dependencies and npm scripts
│
└── src/
    ├── main.tsx                    # React entry — ReactDOM.createRoot
    ├── App.tsx                     # Root: routing, auth guards, navigation
    ├── styles.css                  # Global CSS variables and resets
    │
    ├── components/                 # Reusable layout & shared UI
    │   ├── AdminLayout.tsx         # Sidebar + top navbar for Placement Head
    │   ├── AdminProfile.tsx        # Admin profile dropdown widget
    │   ├── ExportButton.tsx        # Reusable PDF / Excel export button
    │   ├── FacultyLayout.tsx       # Sidebar + top navbar for Faculty
    │   ├── FacultyProfile.tsx      # Faculty profile dropdown widget
    │   └── StudentLayout.tsx       # Sidebar + top navbar for Student
    │
    ├── pages/                      # Full-page components (one per route)
    │   │
    │   ├── GetStarted.tsx          # Landing page — role selection cards
    │   ├── AdminFacultyLogin.tsx   # Login for Faculty & Admin
    │   ├── StudentLogin.tsx        # Student login page
    │   ├── StudentRegister.tsx     # Student registration page
    │   │
    │   ├── ── Student Pages ──────────────────────
    │   ├── StudentDashboard.tsx    # Student home with stats overview
    │   ├── StudentProfile.tsx      # 8-section tabbed profile builder
    │   ├── StudentDrives.tsx       # Browse and apply for drives
    │   ├── StudentApplications.tsx # Track application stage pipeline
    │   ├── StudentOffers.tsx       # View received placement offers
    │   └── StudentAnnouncements.tsx # Read announcements and events
    │   │
    │   ├── ── Faculty Pages ──────────────────────
    │   ├── FacultyDashboard.tsx    # Faculty home with dept statistics
    │   ├── StudentVerification.tsx # Profile approval/rejection workflow
    │   ├── DepartmentDrives.tsx    # Department drive overview
    │   ├── DriveFiltering.tsx      # Eligibility engine results UI
    │   └── StageManagement.tsx     # Application stage kanban pipeline
    │   │
    │   └── ── Admin (Placement Head) Pages ────────
    │       ├── PlacementHeadDashboard.tsx  # KPI dashboard
    │       ├── CompanyManagement.tsx       # CRUD for companies
    │       ├── DriveManagement.tsx         # Create / edit / manage drives
    │       ├── DriveEligibility.tsx        # Set eligibility criteria per drive
    │       ├── Shortlisting.tsx            # Generate ranked shortlists
    │       ├── OfferManagement.tsx         # Record and view offers
    │       ├── StudentManagement.tsx       # Search / lock / view students
    │       ├── Analytics.tsx               # Charts and placement stats
    │       ├── Announcements.tsx           # Create/delete announcements
    │       └── AuditLogs.tsx               # Searchable audit trail viewer
    │
    ├── styles/                     # Page-scoped CSS files
    │   ├── auth-modern.css         # Login and register page styles
    │   └── dashboard.css           # Dashboard cards and layout styles
    │
    └── utils/                      # Shared utilities and constants
        ├── api.ts                  # Axios instance — baseURL + JWT interceptor
        ├── exportUtils.ts          # jsPDF + xlsx export logic
        └── routes.ts               # ROUTES object — single source of truth
```

### Folder Responsibilities

| Folder / File | Responsibility |
|---|---|
| `components/` | Layout wrappers (sidebar + navbar) and shared widgets reused across pages |
| `pages/` | Each file is one full page rendered at a specific route |
| `styles/` | Component-specific CSS scoped to each page context |
| `utils/api.ts` | Single Axios instance; JWT interceptor attaches Bearer token automatically |
| `utils/exportUtils.ts` | `jsPDF` and `xlsx` export logic separated from UI components |
| `utils/routes.ts` | **Single source of truth** for all route strings — no hardcoded paths in components |

---

## 🧭 Frontend Logic Flow

### Student Flow

```
Landing Page (/)
       │
       ▼
/student/login  →  POST /api/student/auth/login
       │           JWT + role stored in localStorage
       ▼
/student/dashboard
       │   GET /api/student/dashboard/stats
       │
       ├──► /student/profile
       │        8-tab form — PUT endpoints for each section
       │        Shows PENDING / VERIFIED / REJECTED badge
       │
       ├──► /student/drives
       │        GET /api/student/drives
       │        Drive cards → POST /api/student/applications/{id}/apply
       │
       ├──► /student/applications
       │        GET /api/student/applications
       │        Stage pipeline view (APPLIED → HR → SELECTED)
       │
       ├──► /student/offers
       │        GET /api/student/offers
       │
       └──► /student/announcements
                GET /api/student/announcements
                GET /api/student/events
```

### Faculty Flow

```
/login  →  POST /api/auth/login  (role = FACULTY)
       │
       ▼
/faculty/dashboard
       │   GET /api/faculty/dashboard/stats
       │
       ├──► /faculty/profile-verification
       │        GET pending verifications
       │        POST /api/faculty/students/{id}/verify
       │   VERIFIED: "All documents confirmed."
       │   REJECTED: "Blurry 10th marksheet — please re-upload."
       │
       ├──► /faculty/department-drives
       │        GET drives + participant counts
       │
       ├──► /faculty/drive-filtering
       │        GET /api/faculty/drives/{id}/filter-eligible
       │        Eligible table + ineligible reasons
       │
       └──► /faculty/stage-management
                GET all applications
                PUT /api/faculty/applications/{id}/stage
```

### Placement Head Complete Workflow

```
/login  →  POST /api/auth/login  (role = PLACEMENT_HEAD)
       │
       ▼
/admin/dashboard
       │   GET /api/admin/dashboard/stats
       │
       ├──► /admin/companies       — CRUD
       ├──► /admin/drives          — Create + status management
       ├──► /admin/eligibility     — Set criteria per drive
       ├──► /admin/shortlisting    — View eligible, generate shortlist
       ├──► /admin/offers          — Record offers, mark drive complete
       ├──► /admin/students        — Search, view, lock/unlock
       ├──► /admin/analytics       — Recharts visualizations
       ├──► /admin/announcements   — Create/delete
       └──► /admin/audit-logs      — Searchable audit trail
```

---

## 📦 NPM Packages Used

### Production Dependencies

| Package | Version | Purpose |
|---|---|---|
| `react` | ^18.3.1 | Core UI component library |
| `react-dom` | ^18.3.1 | DOM rendering via `ReactDOM.createRoot` |
| `react-router-dom` | ^7.13.1 | Client-side routing — `<Routes>`, `useNavigate`, `<Navigate>` |
| `recharts` | ^2.12.7 | Composable charts — `BarChart`, `PieChart`, `LineChart` for analytics |
| `lucide-react` | ^0.453.0 | Consistent SVG icon set used throughout the UI |
| `jspdf` | ^4.2.0 | Client-side PDF generation from JavaScript |
| `jspdf-autotable` | ^5.0.7 | `autoTable()` plugin — tabular data in PDFs |
| `xlsx` | ^0.18.5 | Excel `.xlsx` file generation and download |

### Dev Dependencies

| Package | Version | Purpose |
|---|---|---|
| `typescript` | ^5.4.5 | Static type checking, DTO interfaces |
| `vite` | ^5.2.0 | Ultra-fast build tool with Hot Module Replacement |
| `@vitejs/plugin-react` | ^5.1.0 | Vite plugin for React fast refresh |
| `@types/react` | ^18.3.5 | TypeScript types for React |
| `@types/react-dom` | ^18.3.0 | TypeScript types for ReactDOM |

### Code Examples

#### React Router DOM — Protected Routes
```typescript
<Routes>
  <Route path={ROUTES.studentDashboard} element={
    <RequireStudent>
      <StudentDashboard onNavigate={handleNavigate} />
    </RequireStudent>
  } />
  <Route path={ROUTES.facultyDashboard} element={
    <RequireFaculty>
      <FacultyDashboard onNavigate={handleNavigate} />
    </RequireFaculty>
  } />
</Routes>
```

#### Recharts — Analytics Bar Chart
```typescript
<BarChart data={departmentData} width={600} height={300}>
  <CartesianGrid strokeDasharray="3 3" />
  <XAxis dataKey="department" />
  <YAxis />
  <Tooltip />
  <Bar dataKey="placed"  fill="#3B82F6" name="Placed" />
  <Bar dataKey="total"   fill="#E5E7EB" name="Total" />
</BarChart>
```

#### jsPDF + autotable — PDF Export
```typescript
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const doc = new jsPDF();
doc.setFontSize(16);
doc.text('VCET CampusHire — Student Report', 14, 20);
autoTable(doc, {
  head: [['Roll No', 'Name', 'CGPA', 'Status']],
  body: students.map(s => [s.rollNo, s.name, s.cgpa, s.status]),
  headStyles: { fillColor: [59, 130, 246] }
});
doc.save('students-report.pdf');
```

#### xlsx — Excel Export
```typescript
import * as XLSX from 'xlsx';

const worksheet = XLSX.utils.json_to_sheet(driveResults);
const workbook  = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(workbook, worksheet, 'Drive Results');
XLSX.writeFile(workbook, `drive-${driveId}-results.xlsx`);
```

---

## 📤 Export System

CampusHire supports two tiers of export — **server-side CSV** (Spring Boot) and **client-side PDF/Excel** (browser).

### Server-Side CSV (Backend)

```http
GET /api/admin/export/students            → students.csv
GET /api/admin/export/drives/{id}/results → drive_{id}_results.csv
```

```java
// AdminExportController.java
return ResponseEntity.ok()
    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"students.csv\"")
    .contentType(MediaType.parseMediaType("text/csv"))
    .body(exportService.exportVerifiedStudentsCsv().getBytes());
```

**Students CSV columns:**
```
Roll No, Name, Email, Department, CGPA, Batch, Verification Status, Is Placed, Highest Package (LPA)
```

**Drive Results CSV columns:**
```
Roll No, Name, Department, CGPA, Stage, CTC Offered, Role, Offer Date
```

---

### Client-Side Export (Frontend — `exportUtils.ts`)

```typescript
// PDF — Student List
export const exportStudentsToPDF = (students: Student[]) => {
  const doc = new jsPDF();
  doc.setFontSize(18);
  doc.setTextColor(59, 130, 246);
  doc.text('VCET CampusHire', 14, 22);
  doc.setFontSize(11);
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 32);
  autoTable(doc, {
    startY: 40,
    head: [['Roll No', 'Name', 'Dept', 'CGPA', 'Status']],
    body: students.map(s => [s.rollNo, s.name, s.department, s.cgpa, s.status]),
    headStyles: { fillColor: [59, 130, 246] },
    alternateRowStyles: { fillColor: [248, 250, 252] }
  });
  doc.save(`students-${Date.now()}.pdf`);
};

// Excel — Drive Results
export const exportDriveToExcel = (title: string, data: DriveResult[]) => {
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Results');
  ws['!cols'] = Object.keys(data[0]).map(() => ({ wch: 20 }));
  XLSX.writeFile(wb, `${title}-results.xlsx`);
};
```

### Export Availability Matrix

| Page | Data Exported | Formats |
|---|---|---|
| Admin → Student Management | All verified students | CSV (server), PDF (client) |
| Admin → Drive Results | Selected students per drive | CSV (server), Excel (client) |
| Faculty → Drive Filtering | Eligible / ineligible breakdown | PDF (client) |
| Faculty → Department Drives | Participation stats | Excel (client) |
| Admin → Analytics | Placement summary | PDF (client) |

---

## 🔐 Security Implementation

### JWT Authentication Flow

```
1. Client POSTs credentials
         ↓
2. AuthService validates email + BCrypt.matches(password, hash)
         ↓
3. JwtService.generateToken() signs JWT with HS256
   Payload: { sub: email, role: FACULTY, iat, exp: +24h }
         ↓
4. Token returned to client → stored in localStorage
         ↓
5. Every request: Authorization: Bearer <token>
         ↓
6. JwtAuthenticationFilter extracts + validates token
         ↓
7. SecurityContextHolder populated with CustomUserDetails
         ↓
8. @PreAuthorize / antMatcher rules enforced
```

### Spring Security Configuration

```java
http
  .csrf(csrf -> csrf.disable())
  .sessionManagement(s -> s.sessionCreationPolicy(STATELESS))
  .authorizeHttpRequests(auth -> auth
      .requestMatchers("/api/auth/**", "/api/student/auth/**").permitAll()
      .requestMatchers("/api/student/**").hasRole("STUDENT")
      .requestMatchers("/api/faculty/**").hasRole("FACULTY")
      .requestMatchers("/api/admin/**").hasRole("PLACEMENT_HEAD")
      .anyRequest().authenticated())
  .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);
```

### Frontend Route Guards

```typescript
function RequireStudent({ children }: { children: JSX.Element }) {
  const role = localStorage.getItem('role');
  if (role !== 'STUDENT') return <Navigate to={ROUTES.studentLogin} replace />;
  return children;
}
function RequireFaculty({ children }: { children: JSX.Element }) {
  const role = localStorage.getItem('role');
  if (role !== 'FACULTY') return <Navigate to={ROUTES.adminLogin} replace />;
  return children;
}
function RequireAdmin({ children }: { children: JSX.Element }) {
  const role = localStorage.getItem('role');
  if (role !== 'PLACEMENT_HEAD') return <Navigate to={ROUTES.adminLogin} replace />;
  return children;
}
```

### Password Security

- Stored using **BCrypt** (cost factor 10) — never plain text
- `passwordHash` excluded from all API responses via `@JsonIgnore`
- Password never logged at any level

### AOP-Based Audit Logging

```java
// Annotation applied to sensitive controller methods
@AuditAction(action = "CREATE_DRIVE", targetEntity = "PlacementDrive")
@PostMapping
public ResponseEntity<?> createDrive(...) { ... }

// AuditAspect intercepts and persists automatically
@Around("@annotation(auditAction)")
public Object logAudit(ProceedingJoinPoint pjp, AuditAction auditAction) {
    // Captures: actor (from SecurityContext), action, entity type,
    //           entity ID, change snapshot (JSON), timestamp, IP
    auditLogRepository.save(buildLog(pjp, auditAction));
    return pjp.proceed();
}
```

### Input Validation

```java
// DTO-level validation
@NotNull @Email            private String email;
@NotNull @Size(min = 8)    private String password;
@NotNull @Min(0) @Max(10)  private Double cgpa;
@NotNull                   private Long companyId;

// Controller enforces with @Valid
@PostMapping
public ResponseEntity<?> createDrive(@Valid @RequestBody PlacementDriveRequestDTO dto) { }
```

---

## 🎨 UI Design System

### Page Layout

```
┌──────────────────────────────────────────────────────────┐
│  TOP NAVBAR                                              │
│  [🎓 CampusHire] [Page Title]     [Profile] [Logout]    │
├─────────────┬────────────────────────────────────────────┤
│             │                                            │
│   SIDEBAR   │            MAIN CONTENT AREA              │
│             │                                            │
│  ● Dashboard│  ┌────────┐  ┌────────┐  ┌────────┐       │
│  ● Profile  │  │  KPI   │  │  KPI   │  │  KPI   │       │
│  ● Drives   │  │  Card  │  │  Card  │  │  Card  │       │
│  ● Apply    │  └────────┘  └────────┘  └────────┘       │
│  ● Offers   │                                            │
│  ● Logout   │  ┌──────────────────────────────────┐     │
│             │  │         Data Table / Chart        │     │
│             │  └──────────────────────────────────┘     │
└─────────────┴────────────────────────────────────────────┘
```

### Color System

| Role / Status | Color | Hex |
|---|---|---|
| Student accent | Blue | `#3B82F6` |
| Faculty accent | Violet | `#8B5CF6` |
| Admin accent | Emerald | `#10B981` |
| VERIFIED / Success | Green | `#22C55E` |
| PENDING / Warning | Amber | `#F59E0B` |
| REJECTED / Error | Red | `#EF4444` |
| Neutral text | Gray | `#6B7280` |

### Reusable Component Patterns

| Pattern | Used In |
|---|---|
| **Stat Cards** | All dashboards — icon, numeric value, label |
| **Data Tables** | Student management, applications, audit logs |
| **Status Badges** | Color-coded PENDING / VERIFIED / REJECTED / SELECTED |
| **Drive Cards** | Student drives page, faculty drive listing |
| **Stage Pipeline** | Application tracking — horizontal progress bar |
| **Modal Forms** | Create/edit/verify — overlay dialogs |
| **Export Button** | `ExportButton.tsx` — dropdown PDF / Excel |
| **Recharts Charts** | Analytics — Bar, Pie, Line charts |

---

## 🚀 Installation & Setup Guide

### Prerequisites

| Tool | Version | Download |
|---|---|---|
| Java JDK | 21 LTS | [adoptium.net](https://adoptium.net/) |
| Maven | 3.9+ | [maven.apache.org](https://maven.apache.org/) |
| PostgreSQL | 15+ | [postgresql.org](https://www.postgresql.org/download/) |
| Node.js | 18+ | [nodejs.org](https://nodejs.org/) |
| Git | Latest | [git-scm.com](https://git-scm.com/) |

---

### Step 1 — Clone the Repository

```bash
git clone https://github.com/your-org/Project-CampusHire.git
cd Project-CampusHire
```

---

### Step 2 — Database Setup

```sql
-- Run in psql or pgAdmin
CREATE DATABASE "CampusHireDB";
GRANT ALL PRIVILEGES ON DATABASE "CampusHireDB" TO postgres;
```

Hibernate auto-creates all tables on first run (`ddl-auto=update`).

Optionally seed sample data:
```bash
psql -U postgres -d CampusHireDB -f backend/seed_data.sql
```

---

### Step 3 — Backend Setup

```bash
cd backend

# Copy example config
copy src\main\resources\application.properties.example ^
     src\main\resources\application.properties
```

Edit `application.properties`:

```properties
spring.datasource.url=jdbc:postgresql://localhost:5432/CampusHireDB
spring.datasource.username=postgres
spring.datasource.password=YOUR_PASSWORD

jwt.secret=your_very_long_256_bit_random_secret_key_here
jwt.expiration-ms=86400000
```

```bash
# Build
mvn clean install

# Run
mvn spring-boot:run
```

Backend starts at → `http://localhost:8081`

---

### Step 4 — Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start dev server
npm run dev
```

Frontend starts at → `http://localhost:5173`

---

### Step 5 — Production Build

```bash
# Backend JAR
cd backend
mvn clean package -DskipTests
java -jar target/backend-0.0.1-SNAPSHOT.jar

# Frontend static files
cd frontend
npm run build
# Output → frontend/dist/
```

---

### Verify Everything Works

1. Open `http://localhost:5173` → GetStarted landing page
2. Click **Faculty / Admin** → login with seeded credentials
3. Click **Student** → register a new account, then complete profile

---

## ⚙️ Environment Configuration

### Backend — `application.properties`

```properties
# ─── Server ────────────────────────────────────
spring.application.name=backend
server.port=8081
spring.profiles.active=dev

# ─── PostgreSQL ─────────────────────────────────
spring.datasource.url=jdbc:postgresql://localhost:5432/CampusHireDB
spring.datasource.username=postgres
spring.datasource.password=YOUR_SECURE_PASSWORD_HERE

# ─── JPA / Hibernate ────────────────────────────
spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=false
spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.PostgreSQLDialect

# ─── JWT ────────────────────────────────────────
# Replace with a 256-bit random string in production!
jwt.secret=change_me_to_a_256bit_secret_key_value_change_me_please
jwt.expiration-ms=86400000
```

> ⚠️ **Never commit real passwords or JWT secrets.** Use environment variables or a secrets manager in production.

### Frontend — `src/utils/api.ts`

```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8081/api',   // Change for production
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;
```

