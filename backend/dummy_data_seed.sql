/*TRUNCATE TABLE 
    audit_logs,
    profile_verifications,
    drive_applications,
    drive_allowed_departments,
    drive_eligibility,
    placement_drives,
    companies,
    student_certifications,
    student_coding_profiles,
    student_professional_profiles,
    schooling_details,
    academic_records,
    student_identity_docs,
    student_contact_details,
    student_personal_details,
    student_profiles,
    events,
    announcements,
    users,
    departments
RESTART IDENTITY CASCADE;*/

-- ==========================================
-- PostgreSQL Data Seeding Script (pgAdmin 4)
-- ==========================================
-- This script matches the exact JPA schema created for CampusHire.
-- It populates Departments, Users, 3NF Student Information, Companies, Drives, and Applications.

-- NOTE: Ensure that Spring Boot has created the tables first by setting:
-- spring.jpa.hibernate.ddl-auto=update

-- ==========================================
-- 1. Departments & Institutional Setup
-- ==========================================
INSERT INTO departments (name, code) VALUES
('Computer Science Engineering', 'CSE'),
('Information Technology', 'IT'),
('Electronics and Communication Engineering', 'ECE'),
('Mechanical Engineering', 'MECH');
select * from departments;
-- ==========================================
-- 2. Authentication & Roles (Users)
-- ==========================================
-- Faculty
INSERT INTO users (email, university_reg_no, password_hash, role, department_id, is_active) VALUES
('hod.cse@college.edu', 'FAC001', 'hashed_pass_123', 'FACULTY', 1, true),
('hod.it@college.edu', 'FAC002', 'hashed_pass_123', 'FACULTY', 2, true);

-- Placement Admin
INSERT INTO users (email, university_reg_no, password_hash, role, department_id, is_active) VALUES
('admin.placement@college.edu', 'ADMIN001', 'hashed_pass_123', 'PLACEMENT_HEAD', NULL, true);

-- Students
INSERT INTO users (email, university_reg_no, password_hash, role, department_id, is_active) VALUES
('aakash.j@student.edu', '913122106001', 'hashed_pass_123', 'STUDENT', 1, true),
('shruthi.m@student.edu', '913122106002', 'hashed_pass_123', 'STUDENT', 1, true),
('rahul.raj@student.edu', '913122106003', 'hashed_pass_123', 'STUDENT', 2, true);

-- ==========================================
-- 3. Core Student Profile
-- ==========================================
INSERT INTO student_profiles (user_id, roll_no, batch, resume_url, verification_status, is_locked, is_eligible_for_placements, interested_on_placement, is_placed, number_of_offers, offer1, offer2, offer3, offer4, opted_offer, highest_package_lpa) VALUES
(4, '22CSEB47', '2022-2026', 'https://aws-s3/resume/aakash.pdf', 'VERIFIED', false, true, true, false, 0, NULL, NULL, NULL, NULL, NULL, NULL),
(5, '22CSEB48', '2022-2026', 'https://aws-s3/resume/shruthi.pdf', 'VERIFIED', false, true, true, true, 2, 'TCS Digital', 'Infosys', NULL, NULL, 'TCS Digital', 7.5),
(6, '22ITA01', '2022-2026', 'https://aws-s3/resume/rahul.pdf', 'PENDING', false, false, true, false, 0, NULL, NULL, NULL, NULL, NULL, NULL);

-- ==========================================
-- 4. Student Domains (Normalized)
-- ==========================================
-- Personal Details
INSERT INTO student_personal_details (student_id, first_name, last_name, father_name, mother_name, father_occupation, mother_occupation, gender, community, date_of_birth, hosteler_or_day_scholar, bio) VALUES
(1, 'Aakash', 'J J', 'Jaisankar J R', 'Ganga J J', 'Salesman (Tiles)', 'Tailor', 'Male', 'BC', '2005-04-11', 'Day scholar', 'Passionate about Web Development and backend scaling strategies.'),
(2, 'Shruthi', 'M', 'Meenakshi N', 'Radha N', 'Bank Manager', 'Housewife', 'Female', 'FC', '2004-10-21', 'Hosteler', 'Full Stack Developer with a knack for UI/UX.'),
(3, 'Rahul', 'Raj', 'Rajkumar T', 'Priya R', 'Engineer', 'Teacher', 'Male', 'MBC', '2005-02-14', 'Day scholar', 'AI enthusiast building predictive models.');

-- Contact Details
INSERT INTO student_contact_details (student_id, alternate_email, student_mobile1, student_mobile2, parent_mobile, landline_no, full_address, city, state, pincode) VALUES
(1, 'opaakash010@gmail.com', '7339514308', '8122335738', '9976663988', 'NA', '6/29, Krishnapuram 4th cross street, kamarajar salai', 'Madurai', 'Tamilnadu', '625009'),
(2, 'shruthi.dev@example.com', '9876543210', '9876543211', '9876543212', '044-234567', '45 Main Road, Anna Nagar', 'Chennai', 'Tamilnadu', '600040'),
(3, 'rahul.ai@example.com', '8888888888', '7777777777', '6666666666', 'NA', 'Block C, Tech Park Layout', 'Coimbatore', 'Tamilnadu', '641014');

-- Identity Docs
INSERT INTO student_identity_docs (student_id, is_aadhar_available, aadhar_number, name_as_per_aadhar, family_card_number, is_pan_card_available, is_passport_available) VALUES
(1, true, '304966572874', 'Aakash J J', '333167702834', false, false),
(2, true, '987654321012', 'Shruthi Meenakshi', '111222333444', true, true),
(3, true, '123456789012', 'Rahul Raj T', '555666777888', false, false);

-- Academic Records (GPA, Arrears)
INSERT INTO academic_records (student_id, ug_year_of_pass, admission_quota, medium_of_instruction, locality, sem1_gpa, sem2_gpa, sem3_gpa, sem4_gpa, sem5_gpa, sem6_gpa, sem7_gpa, sem8_gpa, cgpa, standing_arrears, history_of_arrears, has_history_of_arrears, course_gap_in_years) VALUES
(1, 2026, 'Management', 'English', 'Urban', 7.71, 7.50, 7.10, 6.96, NULL, NULL, NULL, NULL, 7.32, 1, 1, true, 0),
(2, 2026, 'Government', 'English', 'Urban', 9.10, 9.20, 8.90, 9.05, NULL, NULL, NULL, NULL, 9.06, 0, 0, false, 0),
(3, 2026, 'Management', 'English', 'Rural', 8.00, 7.90, 7.50, 7.80, NULL, NULL, NULL, NULL, 7.80, 0, 2, true, 0);

-- Schooling Details
INSERT INTO schooling_details (student_id, x_marks_percentage, x_year_of_passing, x_school_name, x_board_of_study, xii_marks_percentage, xii_year_of_passing, xii_school_name, xii_board_of_study, xii_cut_off_marks, diploma_marks_percentage) VALUES
(1, 69.80, 2020, 'Mother Theresa matriculation', 'State Board', 78.90, 2022, 'V H N Higher Secondary School', 'State Board', 152.00, NULL),
(2, 95.50, 2020, 'DAV Public School', 'CBSE', 92.40, 2022, 'DAV Public School', 'CBSE', 190.50, NULL),
(3, 85.00, 2020, 'Govt Boys High School', 'State Board', 84.00, 2022, 'Govt Boys High School', 'State Board', 175.00, NULL);

-- Professional Profiles
INSERT INTO student_professional_profiles (student_id, linkedin_profile_url, github_profile_url, portfolio_url, leetcode_profile_url, leetcode_problems_solved, leetcode_rating, hackerrank_profile_url, codechef_profile_url, codeforces_profile_url) VALUES
(1, 'linkedin.com/in/aakashjj', 'github.com/aakash010', 'aakash.dev', 'leetcode.com/aakashjj', 150, '1450', NULL, NULL, NULL),
(2, 'linkedin.com/in/shruthi-m', 'github.com/ShruthiMeenakshi', 'shruthi.tech', 'leetcode.com/shruthi123', 350, '1700', 'hackerrank.com/shruthi123', 'codechef.com/users/shruthi_m', NULL),
(3, 'linkedin.com/in/rahulraj', 'github.com/rahulraj', NULL, 'leetcode.com/rahulraj', 50, '1200', NULL, NULL, NULL);

-- Certifications (One To Many)
INSERT INTO student_certifications (student_id, skill_name, duration, vendor) VALUES
(1, 'Python, IOT 4.0', '12 weeks', 'NPTEL'),
(2, 'AWS Certified Solutions Architect', '6 months', 'Amazon'),
(2, 'React Development', '8 weeks', 'Coursera');

-- ==========================================
-- 5. Placements Context
-- ==========================================
-- Companies
INSERT INTO companies (name, website, industry, visit_history) VALUES
('TCS', 'tcs.com', 'IT Services', 'Visited 2021, 2022, 2023'),
('Zoho', 'zoho.com', 'SaaS', 'Visited 2023'),
('Amazon', 'amazon.jobs', 'E-commerce / Cloud', 'Visited 2022');

-- Drives
INSERT INTO placement_drives (company_id, title, role, ctc_lpa, status) VALUES
(1, 'TCS Mass Recruitment 2026', 'Systems Engineer', 3.36, 'ONGOING'),
(1, 'TCS Digital 2026', 'Software Engineer (Digital)', 7.50, 'COMPLETED'),
(2, 'Zoho Developer Hiring', 'Software Developer', 8.50, 'UPCOMING');

-- Eligibility Criteria Engine
INSERT INTO drive_eligibility (drive_id, min_cgpa, min_x_marks, min_xii_marks, max_standing_arrears, max_history_of_arrears) VALUES
(1, 6.00, 60.00, 60.00, 1, 2), -- Relaxed TCS criteria
(2, 7.50, 75.00, 75.00, 0, 0), -- Strict TCS Digital criteria
(3, 8.00, 80.00, 80.00, 0, 1); -- Strict Zoho criteria


-- M2M Department Link for Drives
INSERT INTO drive_allowed_departments (drive_id, department_id) VALUES
(1, 1), (1, 2), (1, 3), (1, 4), -- TCS Mass allows all
(2, 1), (2, 2), -- TCS Digital only CSE/IT
(3, 1), (3, 2); -- Zoho only CSE/IT

-- ==========================================
-- 6. Applications (The Execution Flow)
-- ==========================================
-- Aakash applied to TCS Mass (Ongoing, HR Stage)
INSERT INTO drive_applications (student_id, drive_id, stage, applied_at, last_updated_at, last_updated_by) VALUES
(1, 1, 'HR', '2025-08-01 10:00:00', '2025-08-10 14:30:00', 1);

-- Shruthi applied to TCS Digital and got SELECTED (Completed)
INSERT INTO drive_applications (student_id, drive_id, stage, applied_at, last_updated_at, last_updated_by) VALUES
(2, 2, 'SELECTED', '2025-07-15 09:00:00', '2025-08-05 18:00:00', 3);

-- ==========================================
-- 7. Governance (Verifications & Audits)
-- ==========================================
INSERT INTO profile_verifications (student_profile_id, faculty_id, status, remarks, verified_at) VALUES
(1, 1, 'VERIFIED', 'All certificates attached properly', '2024-03-10 10:00:00'),
(2, 1, 'VERIFIED', 'Outstanding record, verified', '2024-03-09 11:30:00');

INSERT INTO audit_logs (user_id, action, target_entity, target_entity_id, details, timestamp, ip_address) VALUES
(3, 'CREATE_DRIVE', 'PlacementDrive', 3, 'Created Zoho Drive for 8.5 LPA', '2025-08-15 15:00:00', '192.168.1.100'),
(3, 'MARK_SELECTED', 'DriveApplication', 2, 'Marked Shruthi M as Selected for TCS Digital', '2025-08-05 18:00:00', '192.168.1.100');

-- ==========================================
-- END OF SEED SCRIPT
-- ==========================================

/*TRUNCATE TABLE 
    audit_logs,
    profile_verifications,
    drive_applications,
    drive_allowed_departments,
    drive_eligibility,
    placement_drives,
    companies,
    student_certifications,
    student_coding_profiles,
    student_professional_profiles,
    schooling_details,
    academic_records,
    student_identity_docs,
    student_contact_details,
    student_personal_details,
    student_profiles,
    events,
    announcements,
    users,
    departments
RESTART IDENTITY CASCADE;
*/