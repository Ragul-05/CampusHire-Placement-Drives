import random
import uuid
import datetime

def escape(val):
    if val is None:
        return 'NULL'
    if isinstance(val, (int, float)):
        return str(val)
    if isinstance(val, bool):
        return 'TRUE' if val else 'FALSE'
    if isinstance(val, (datetime.date, datetime.datetime)):
        return f"'{val.isoformat()}'"
    val_str = str(val).replace("'", "''")
    return f"'{val_str}'"

departments = [
    (1, 'Computer Science and Engineering', 'CSE'),
    (2, 'Information Technology', 'IT'),
    (3, 'Electronics and Communication', 'ECE'),
    (4, 'Electrical and Electronics', 'EEE'),
    (5, 'Mechanical Engineering', 'MECH'),
    (6, 'Civil Engineering', 'CIVIL'),
    (7, 'Artificial Intelligence', 'AI'),
    (8, 'Data Science', 'DS'),
]

print("-- TRUNCATE AND RESTART IDENTITY")
tables = [
    'audit_logs', 'events', 'announcements', 'profile_verifications', 'drive_applications',
    'drive_allowed_departments', 'drive_eligibility', 'placement_drives', 'companies',
    'student_certifications', 'student_professional_profiles', 'schooling_details',
    'academic_records', 'student_identity_docs', 'student_contact_details',
    'student_personal_details', 'student_profiles', 'users', 'departments'
]
print(f"TRUNCATE TABLE {', '.join(tables)} RESTART IDENTITY CASCADE;")
print()

print("-- 1. Departments")
for d in departments:
    print(f"INSERT INTO departments (id, name, code) VALUES ({d[0]}, {escape(d[1])}, {escape(d[2])});")
print()

print("-- 2. Users")
# Generate 5 Faculties (one for first 5 depts)
# Generate 2 Placement Heads
# Generate 50 Students
num_faculties = 5
num_placement_heads = 2
num_students = 50

users = []
user_id = 1
for i in range(num_faculties):
    dept = random.choice(departments)[0]
    users.append((user_id, f'faculty{i+1}@college.edu', f'FAC{1000+i}', 'hashed_pwd', 'FACULTY', dept, True))
    user_id += 1

for i in range(num_placement_heads):
    users.append((user_id, f'head{i+1}@college.edu', f'PH{1000+i}', 'hashed_pwd', 'PLACEMENT_HEAD', 'NULL', True))
    user_id += 1

student_user_start_id = user_id
for i in range(num_students):
    dept = random.choice(departments)[0]
    users.append((user_id, f'student{i+1}@college.edu', f'REG2022{1000+i}', 'hashed_pwd', 'STUDENT', dept, True))
    user_id += 1

for u in users:
    dept_val = u[5] if u[5] != 'NULL' else 'NULL'
    print(f"INSERT INTO users (id, email, university_reg_no, password_hash, role, department_id, is_active) VALUES ({u[0]}, {escape(u[1])}, {escape(u[2])}, {escape(u[3])}, {escape(u[4])}, {dept_val}, {escape(u[6])});")
print()

print("-- 3. Student Profiles")
student_profiles = []
profile_id = 1
for i in range(num_students):
    uid = student_user_start_id + i
    status = random.choice(['PENDING', 'VERIFIED', 'VERIFIED', 'REJECTED'])
    student_profiles.append((
        profile_id, uid, f'ROLL{1000+i}', '2022-2026', f'https://s3.aws.com/resume/{uid}.pdf',
        status, False, True, True, False, 0,
        None, None, None, None, None, None
    ))
    profile_id += 1

for p in student_profiles:
    print(f"INSERT INTO student_profiles (id, user_id, roll_no, batch, resume_url, verification_status, is_locked, is_eligible_for_placements, interested_on_placement, is_placed, number_of_offers) VALUES ({p[0]}, {p[1]}, {escape(p[2])}, {escape(p[3])}, {escape(p[4])}, {escape(p[5])}, {escape(p[6])}, {escape(p[7])}, {escape(p[8])}, {escape(p[9])}, {p[10]});")
print()

print("-- 4. Student Personal Details")
first_names = ['Amit', 'Priya', 'Rahul', 'Neha', 'Vikram', 'Anjali', 'Rohan', 'Sneha', 'Arjun', 'Kavita']
last_names = ['Sharma', 'Verma', 'Singh', 'Patel', 'Kumar', 'Gupta', 'Rao', 'Das', 'Reddy', 'Nair']
for i in range(num_students):
    sid = i + 1
    fn = random.choice(first_names)
    ln = random.choice(last_names)
    print(f"INSERT INTO student_personal_details (student_id, first_name, last_name, father_name, mother_name, father_occupation, mother_occupation, gender, community, date_of_birth, hosteler_or_day_scholar, bio) VALUES ({sid}, {escape(fn)}, {escape(ln)}, {escape(fn+' Sr.')}, {escape(ln+' Mrs.')}, 'Engineer', 'Teacher', {escape(random.choice(['MALE', 'FEMALE']))}, 'OBC', '2004-05-15', 'HOSTELER', 'Enthusiastic learner.');")
print()

print("-- 5. Student Contact Details")
for i in range(num_students):
    sid = i + 1
    print(f"INSERT INTO student_contact_details (student_id, alternate_email, student_mobile1, student_mobile2, parent_mobile, landline_no, full_address, city, state, pincode) VALUES ({sid}, {escape('alt'+str(sid)+'@gmail.com')}, '9876543210', '9876543211', '9876543212', '044-2435678', '123 Main St', 'Chennai', 'Tamil Nadu', '600001');")
print()

print("-- 6. Student Identity Docs")
for i in range(num_students):
    sid = i + 1
    print(f"INSERT INTO student_identity_docs (student_id, is_aadhar_available, aadhar_number, name_as_per_aadhar, family_card_number, is_pan_card_available, is_passport_available) VALUES ({sid}, TRUE, '{100000000000+sid}', 'AadharName {sid}', 'FC12345', TRUE, FALSE);")
print()

print("-- 7. Academic Records")
for i in range(num_students):
    sid = i + 1
    cgpa = round(random.uniform(6.0, 9.8), 2)
    arrears = random.choice([0, 0, 0, 1, 2])
    print(f"INSERT INTO academic_records (student_id, ug_year_of_pass, admission_quota, medium_of_instruction, locality, sem1_gpa, sem2_gpa, sem3_gpa, sem4_gpa, sem5_gpa, sem6_gpa, sem7_gpa, sem8_gpa, cgpa, standing_arrears, history_of_arrears, has_history_of_arrears, course_gap_in_years) VALUES ({sid}, 2026, 'Management', 'English', 'Urban', 8.0, 8.2, 8.5, 8.1, 8.3, 8.6, 8.4, 8.5, {cgpa}, {arrears}, {arrears}, {escape(arrears > 0)}, 0);")
print()

print("-- 8. Schooling Details")
for i in range(num_students):
    sid = i + 1
    print(f"INSERT INTO schooling_details (student_id, x_marks_percentage, x_year_of_passing, x_school_name, x_board_of_study, xii_marks_percentage, xii_year_of_passing, xii_school_name, xii_board_of_study, xii_cut_off_marks, diploma_marks_percentage) VALUES ({sid}, 90.5, 2020, 'DAV Public', 'CBSE', 92.0, 2022, 'DAV Public', 'CBSE', 190.5, NULL);")
print()

print("-- 9. Professional Profiles")
for i in range(num_students):
    sid = i + 1
    print(f"INSERT INTO student_professional_profiles (student_id, linkedin_profile_url, github_profile_url, portfolio_url, leetcode_profile_url, leetcode_problems_solved, leetcode_rating, hackerrank_profile_url, codechef_profile_url, codeforces_profile_url) VALUES ({sid}, 'url', 'url', 'url', 'url', {random.randint(50, 500)}, '1500', 'url', 'url', 'url');")
print()

print("-- 10. Student Certifications (50 total)")
for i in range(50):
    sid = random.randint(1, num_students)
    print(f"INSERT INTO student_certifications (student_id, skill_name, duration, vendor) VALUES ({sid}, 'AWS Cloud', '3 months', 'AWS');")
print()

print("-- 11. Companies")
companies = ['Google', 'Microsoft', 'TCS', 'Infosys', 'Wipro', 'Amazon', 'Meta', 'Netflix', 'Apple', 'Adobe']
company_ids = []
for i in range(50):
    cid = i + 1
    cname = random.choice(companies) + f" {cid}"
    print(f"INSERT INTO companies (id, name, website, industry, visit_history) VALUES ({cid}, {escape(cname)}, {escape('www.'+cname.replace(' ','').lower()+'.com')}, 'IT', 'Visited 2023');")
    company_ids.append(cid)
print()

print("-- 12. Placement Drives")
drive_ids = []
for i in range(50):
    did = i + 1
    cid = random.choice(company_ids)
    status = random.choice(['UPCOMING', 'ONGOING', 'COMPLETED'])
    print(f"INSERT INTO placement_drives (id, company_id, title, role, ctc_lpa, status) VALUES ({did}, {cid}, {escape('Software Engineer Hiring ' + str(did))}, 'SDE', {random.choice([3.5, 5.0, 7.0, 10.0, 15.0, 20.0])}, {escape(status)});")
    drive_ids.append(did)
print()

print("-- 13. Drive Eligibility")
for did in drive_ids:
    print(f"INSERT INTO drive_eligibility (drive_id, min_cgpa, min_x_marks, min_xii_marks, max_standing_arrears, max_history_of_arrears) VALUES ({did}, 7.0, 60.0, 60.0, 0, 2);")
print()

print("-- 14. Drive Allowed Departments")
for i in range(50):
    did = random.choice(drive_ids)
    dept_id = random.choice(departments)[0]
    print(f"INSERT INTO drive_allowed_departments (drive_id, department_id) VALUES ({did}, {dept_id}) ON CONFLICT DO NOTHING;")
print()

print("-- 15. Drive Applications")
stages = ['APPLIED', 'ASSESSMENT', 'TECHNICAL', 'HR', 'SELECTED', 'REJECTED']
for i in range(50):
    app_id = i + 1
    sid = random.randint(1, num_students)
    did = random.choice(drive_ids)
    stage = random.choice(stages)
    print(f"INSERT INTO drive_applications (id, student_id, drive_id, stage, applied_at, last_updated_at, last_updated_by) VALUES ({app_id}, {sid}, {did}, {escape(stage)}, '2024-01-01 10:00:00', '2024-01-02 10:00:00', 1);")
print()

print("-- 16. Profile Verifications")
for i in range(50):
    vid = i + 1
    sid = i + 1 # Use sequential ID to ensure 1:1 relationship
    status = random.choice(['PENDING', 'VERIFIED', 'REJECTED'])
    print(f"INSERT INTO profile_verifications (id, student_profile_id, faculty_id, status, remarks, verified_at) VALUES ({vid}, {sid}, 1, {escape(status)}, 'Checks done', '2024-01-01 10:00:00');")
print()

print("-- 17. Announcements")
for i in range(50):
    aid = i + 1
    scope = random.choice(['GLOBAL', 'DEPARTMENT'])
    dept_val = random.choice(departments)[0] if scope == 'DEPARTMENT' else 'NULL'
    print(f"INSERT INTO announcements (id, title, content, scope, department_id, created_by, created_at) VALUES ({aid}, 'Announcement {aid}', 'Details for announcement {aid}', {escape(scope)}, {dept_val}, 1, '2024-01-01 10:00:00');")
print()

print("-- 18. Events")
for i in range(50):
    eid = i + 1
    dept_val = random.choice([random.choice(departments)[0], 'NULL'])
    print(f"INSERT INTO events (id, title, description, scheduled_at, location_or_link, department_id) VALUES ({eid}, 'Event {eid}', 'Event Details', '2024-05-01 10:00:00', 'Online', {dept_val});")
print()

print("-- 19. Audit Logs")
for i in range(50):
    logid = i + 1
    print(f"INSERT INTO audit_logs (id, user_id, action, target_entity, target_entity_id, details, timestamp, ip_address) VALUES ({logid}, 1, 'CREATE', 'PlacementDrive', {random.choice(drive_ids)}, '{{}}', '2024-01-01 12:00:00', '192.168.1.1');")
print()

# Update sequences
print("-- UPDATE SEQUENCES")
print("SELECT setval('users_id_seq', (SELECT MAX(id) FROM users));")
print("SELECT setval('student_profiles_id_seq', (SELECT MAX(id) FROM student_profiles));")
print("SELECT setval('student_certifications_id_seq', (SELECT MAX(id) FROM student_certifications));")
print("SELECT setval('companies_id_seq', (SELECT MAX(id) FROM companies));")
print("SELECT setval('placement_drives_id_seq', (SELECT MAX(id) FROM placement_drives));")
print("SELECT setval('drive_applications_id_seq', (SELECT MAX(id) FROM drive_applications));")
print("SELECT setval('profile_verifications_id_seq', (SELECT MAX(id) FROM profile_verifications));")
print("SELECT setval('announcements_id_seq', (SELECT MAX(id) FROM announcements));")
print("SELECT setval('events_id_seq', (SELECT MAX(id) FROM events));")
print("SELECT setval('audit_logs_id_seq', (SELECT MAX(id) FROM audit_logs));")
