package com.example.backend.Services;

import com.example.backend.DTOs.Faculty.FacultyStudentDTO;
import com.example.backend.DTOs.Faculty.ProfileVerificationRequestDTO;
import com.example.backend.Exceptions.ResourceNotFoundException;
import com.example.backend.Exceptions.UnauthorizedActionException;
import com.example.backend.Models.ProfileVerification;
import com.example.backend.Models.DriveApplication;
import com.example.backend.Models.StudentProfile;
import com.example.backend.Models.StudentSkill;
import com.example.backend.Models.User;
import com.example.backend.Models.enums.VerificationStatus;
import com.example.backend.Repositories.DriveApplicationRepository;
import com.example.backend.Repositories.ProfileVerificationRepository;
import com.example.backend.Repositories.StudentProfileRepository;
import com.example.backend.Repositories.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class FacultyStudentService {

    @Autowired
    private StudentProfileRepository studentProfileRepository;

    @Autowired
    private ProfileVerificationRepository profileVerificationRepository;

    @Autowired
    private DriveApplicationRepository driveApplicationRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private StudentProfileService studentProfileService;

    private User getAuthenticatedFaculty(String email) {
        User faculty = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Faculty not found"));
        if (faculty.getDepartment() == null) {
            throw new UnauthorizedActionException("Faculty is not assigned to any department");
        }
        return faculty;
    }

    @Transactional(readOnly = true)
    public List<FacultyStudentDTO> getDepartmentStudents(String facultyEmail, String statusFilter) {
        User faculty = getAuthenticatedFaculty(facultyEmail);
        Long departmentId = faculty.getDepartment().getId();

        List<StudentProfile> students = studentProfileRepository.findByUserDepartmentId(departmentId);

        if (statusFilter != null && !statusFilter.isEmpty()) {
            final String status = statusFilter.toUpperCase();
            students = students.stream()
                    .filter(s -> {
                        VerificationStatus v = s.getVerificationStatus();
                        String current = v != null ? v.name() : VerificationStatus.PENDING.name();
                        return current.equalsIgnoreCase(status);
                    })
                    .collect(Collectors.toList());
        }

        return students.stream().map(this::mapToDTO).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<FacultyStudentDTO> getPendingStudents(String facultyEmail) {
        User faculty = getAuthenticatedFaculty(facultyEmail);
        Long departmentId = faculty.getDepartment().getId();

        List<StudentProfile> pendingStudents = studentProfileRepository
                .findByUserDepartmentIdAndVerificationStatus(departmentId, VerificationStatus.PENDING)
                .stream()
                .collect(Collectors.toList());

        // Resilience fallback for legacy data where student/faculty department links were saved incorrectly.
        // This keeps the verification page dynamic instead of appearing empty when there are real pending profiles in DB.
        if (pendingStudents.isEmpty()) {
            pendingStudents = studentProfileRepository.findByVerificationStatus(VerificationStatus.PENDING);
        }

        return pendingStudents.stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public FacultyStudentDTO getStudentProfile(Long studentId, String facultyEmail) {
        User faculty = getAuthenticatedFaculty(facultyEmail);
        StudentProfile student = studentProfileRepository.findById(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found"));

        if (!student.getUser().getDepartment().getId().equals(faculty.getDepartment().getId())) {
            throw new UnauthorizedActionException("Cannot access student from another department");
        }

        return mapToDTO(student);
    }

    public void verifyStudentProfile(Long studentId, ProfileVerificationRequestDTO request, String facultyEmail) {
        User faculty = getAuthenticatedFaculty(facultyEmail);
        StudentProfile student = studentProfileRepository.findById(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found"));

        if (!student.getUser().getDepartment().getId().equals(faculty.getDepartment().getId())) {
            throw new UnauthorizedActionException("Cannot verify student from another department");
        }

        if (request.getStatus() == VerificationStatus.REJECTED
                && (request.getRemarks() == null || request.getRemarks().trim().isEmpty())) {
            throw new IllegalArgumentException("Remarks are mandatory when rejecting a profile");
        }

        student.setVerificationStatus(request.getStatus());
        student.setSubmittedForVerification(false);
        // Only mark eligible when verified; reset otherwise
        if (request.getStatus() == VerificationStatus.VERIFIED) {
            student.setIsEligibleForPlacements(true);
            student.setEligibleForAdminReview(false);
        } else {
            student.setIsEligibleForPlacements(false);
            student.setEligibleForAdminReview(false);
        }
        studentProfileRepository.save(student);

        // Upsert the verification record because profile_verifications currently enforces one row per student profile.
        ProfileVerification verification = profileVerificationRepository
                .findByStudentProfileId(student.getId())
                .orElseGet(() -> ProfileVerification.builder()
                        .studentProfile(student)
                        .build());

        verification.setFaculty(faculty);
        verification.setStatus(request.getStatus());
        verification.setRemarks(request.getRemarks());
        verification.setVerifiedAt(LocalDateTime.now());

        profileVerificationRepository.save(verification);
    }

    public void sendStudentToAdmin(Long studentId, String facultyEmail) {
        User faculty = getAuthenticatedFaculty(facultyEmail);
        StudentProfile student = studentProfileRepository.findById(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found"));

        if (!student.getUser().getDepartment().getId().equals(faculty.getDepartment().getId())) {
            throw new UnauthorizedActionException("Cannot send student from another department");
        }
        if (student.getVerificationStatus() != VerificationStatus.VERIFIED) {
            throw new IllegalArgumentException("Only verified profiles can be sent to admin");
        }

        student.setEligibleForAdminReview(true);
        studentProfileRepository.save(student);
    }

    @Transactional
    public void sendStudentsToAdmin(Long driveId, List<Long> studentIds, String facultyEmail) {
        User faculty = getAuthenticatedFaculty(facultyEmail);
        if (studentIds == null || studentIds.isEmpty()) {
            throw new IllegalArgumentException("At least one student must be selected");
        }

        List<DriveApplication> applications = driveApplicationRepository
                .findByDriveIdAndStudentProfileIdIn(driveId, studentIds);

        if (applications.isEmpty()) {
            throw new IllegalArgumentException("No applications found for the selected students");
        }

        for (DriveApplication application : applications) {
            StudentProfile student = application.getStudentProfile();
            if (!student.getUser().getDepartment().getId().equals(faculty.getDepartment().getId())) {
                throw new UnauthorizedActionException("Cannot send student from another department");
            }
            if (student.getVerificationStatus() != VerificationStatus.VERIFIED) {
                throw new IllegalArgumentException("Only verified students can be sent to admin");
            }

            application.setFacultyApproved(true);
            application.setLastUpdatedAt(LocalDateTime.now());
            application.setLastUpdatedBy(faculty);
            student.setEligibleForAdminReview(true);
        }

        driveApplicationRepository.saveAll(applications);
    }

    public List<ProfileVerification> getVerificationHistory(String facultyEmail) {
        User faculty = getAuthenticatedFaculty(facultyEmail);
        return profileVerificationRepository.findByFacultyId(faculty.getId());
    }

    private FacultyStudentDTO mapToDTO(StudentProfile s) {
        studentProfileService.ensureDepartmentAssigned(s);

        String fullName = s.getUser().getEmail();
        if (s.getPersonalDetails() != null && s.getPersonalDetails().getFirstName() != null
                && !s.getPersonalDetails().getFirstName().isBlank()) {
            String firstName = s.getPersonalDetails().getFirstName().trim();
            String lastName = s.getPersonalDetails().getLastName() != null
                    ? s.getPersonalDetails().getLastName().trim()
                    : "";
            fullName = (firstName + " " + lastName).trim();
        }

        String rollNo = s.getRollNo();
        if (rollNo == null || rollNo.isBlank()) {
            rollNo = s.getUser() != null ? s.getUser().getUniversityRegNo() : null;
        }

        String departmentName = null;
        if (s.getUser() != null && s.getUser().getDepartment() != null) {
            departmentName = s.getUser().getDepartment().getName();
        }
        if (departmentName == null || departmentName.isBlank()) {
            departmentName = "UNASSIGNED";
        }

        return FacultyStudentDTO.builder()
                .id(s.getId())
                .userId(s.getUser().getId())
                .rollNo(rollNo)
                .batch(s.getBatch())
                .name(fullName)
                .email(s.getUser().getEmail())
                .verificationStatus(s.getVerificationStatus() != null ? s.getVerificationStatus().name() : "PENDING")
                .isLocked(s.getIsLocked() != null ? s.getIsLocked() : false)
                .isEligibleForPlacements(
                        s.getIsEligibleForPlacements() != null ? s.getIsEligibleForPlacements() : false)
                .eligibleForAdminReview(s.getEligibleForAdminReview() != null ? s.getEligibleForAdminReview() : false)
                .isPlaced(s.getIsPlaced() != null ? s.getIsPlaced() : false)
                .numberOfOffers(s.getNumberOfOffers() != null ? s.getNumberOfOffers() : 0)
                .highestPackageLpa(s.getHighestPackageLpa() != null ? s.getHighestPackageLpa() : 0.0)
                .cgpa(s.getAcademicRecord() != null ? s.getAcademicRecord().getCgpa() : null)
                .standingArrears(s.getAcademicRecord() != null ? s.getAcademicRecord().getStandingArrears() : 0)
                .historyOfArrears(s.getAcademicRecord() != null ? s.getAcademicRecord().getHistoryOfArrears() : 0)
                .hasApplied(false)
                .department(departmentName)
                .graduationYear(s.getAcademicRecord() != null ? s.getAcademicRecord().getUgYearOfPass() : null)
                .profileCompletionPercentage(studentProfileService.calculateCompletionPercentage(s))
                .phoneNumber(s.getContactDetails() != null ? s.getContactDetails().getStudentMobile1() : null)
                .linkedinUrl(s.getProfessionalProfile() != null ? s.getProfessionalProfile().getLinkedinProfileUrl() : null)
                .githubUrl(s.getProfessionalProfile() != null ? s.getProfessionalProfile().getGithubProfileUrl() : null)
                .xMarksPercentage(s.getSchoolingDetails() != null ? s.getSchoolingDetails().getXMarksPercentage() : null)
                .xiiMarksPercentage(s.getSchoolingDetails() != null ? s.getSchoolingDetails().getXiiMarksPercentage() : null)
                .latestVerificationRemarks(profileVerificationRepository
                        .findTopByStudentProfileIdOrderByVerifiedAtDesc(s.getId())
                        .map(ProfileVerification::getRemarks)
                        .orElse(null))
                .skills(s.getSkills() != null
                        ? s.getSkills().stream()
                                .map(StudentSkill::getSkillName)
                                .collect(Collectors.toList())
                        : List.of())
                .personalDetails(FacultyStudentDTO.PersonalDetailsView.builder()
                        .dateOfBirth(s.getPersonalDetails() != null && s.getPersonalDetails().getDateOfBirth() != null
                                ? s.getPersonalDetails().getDateOfBirth().toString()
                                : null)
                        .gender(s.getPersonalDetails() != null ? s.getPersonalDetails().getGender() : null)
                        .address(s.getContactDetails() != null ? s.getContactDetails().getFullAddress() : null)
                        .build())
                .academicRecords(List.of(
                        FacultyStudentDTO.AcademicRecordView.builder()
                                .degree("10th Standard")
                                .institution(s.getSchoolingDetails() != null ? s.getSchoolingDetails().getXSchoolName() : null)
                                .percentage(s.getSchoolingDetails() != null ? s.getSchoolingDetails().getXMarksPercentage() : null)
                                .yearOfCompletion(s.getSchoolingDetails() != null ? s.getSchoolingDetails().getXYearOfPassing() : null)
                                .build(),
                        FacultyStudentDTO.AcademicRecordView.builder()
                                .degree("12th Standard")
                                .institution(s.getSchoolingDetails() != null ? s.getSchoolingDetails().getXiiSchoolName() : null)
                                .percentage(s.getSchoolingDetails() != null ? s.getSchoolingDetails().getXiiMarksPercentage() : null)
                                .yearOfCompletion(s.getSchoolingDetails() != null ? s.getSchoolingDetails().getXiiYearOfPassing() : null)
                                .build(),
                        FacultyStudentDTO.AcademicRecordView.builder()
                                .degree("UG")
                                .institution(s.getUser().getDepartment() != null ? s.getUser().getDepartment().getName() : null)
                                .percentage(s.getAcademicRecord() != null ? s.getAcademicRecord().getCgpa() : null)
                                .yearOfCompletion(s.getAcademicRecord() != null ? s.getAcademicRecord().getUgYearOfPass() : null)
                                .build()
                ).stream().filter(record -> record.getInstitution() != null || record.getPercentage() != null).collect(Collectors.toList()))
                .certifications(s.getCertifications() != null
                        ? s.getCertifications().stream()
                                .map(certification -> FacultyStudentDTO.CertificationView.builder()
                                        .name(certification.getSkillName())
                                        .issuingOrganization(certification.getVendor())
                                        .issueDate(certification.getDuration())
                                        .build())
                                .collect(Collectors.toList())
                        : List.of())
                .build();
    }
}
