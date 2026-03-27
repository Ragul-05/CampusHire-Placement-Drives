package com.example.backend.Services;

import com.example.backend.DTOs.Faculty.DriveFilterResultDTO;
import com.example.backend.DTOs.Faculty.EligibilityCriteriaDTO;
import com.example.backend.DTOs.Faculty.FacultyDriveDTO;
import com.example.backend.DTOs.Faculty.FacultyStudentDTO;
import com.example.backend.Exceptions.ResourceNotFoundException;
import com.example.backend.Exceptions.UnauthorizedActionException;
import com.example.backend.Models.Department;
import com.example.backend.Models.DriveApplication;
import com.example.backend.Models.EligibilityCriteria;
import com.example.backend.Models.PlacementDrive;
import com.example.backend.Models.StudentProfile;
import com.example.backend.Models.StudentSkill;
import com.example.backend.Models.User;
import com.example.backend.Models.enums.ApplicationStage;
import com.example.backend.Models.enums.DriveStatus;
import com.example.backend.Models.enums.Role;
import com.example.backend.Models.enums.VerificationStatus;
import com.example.backend.Repositories.DriveApplicationRepository;
import com.example.backend.Repositories.PlacementDriveRepository;
import com.example.backend.Repositories.StudentProfileRepository;
import com.example.backend.Repositories.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class FacultyDriveFilteringService {

    @Autowired
    private PlacementDriveRepository placementDriveRepository;

    @Autowired
    private StudentProfileRepository studentProfileRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private DriveApplicationRepository driveApplicationRepository;

    @Autowired
    private PlacementEligibilityService placementEligibilityService;

    @Autowired
    private StudentProfileService studentProfileService;

    public List<FacultyDriveDTO> getActiveDrivesForFaculty(String facultyEmail) {
        User faculty = getAuthenticatedFaculty(facultyEmail);
        Long departmentId = faculty.getDepartment().getId();

        return placementDriveRepository
                .findByStatusInAndAllowedDepartmentId(List.of(DriveStatus.UPCOMING, DriveStatus.ONGOING), departmentId)
                .stream()
                .map(this::mapDriveToDTO)
                .collect(Collectors.toList());
    }

    public List<FacultyDriveDTO> getAllDrivesForFaculty(String facultyEmail) {
        User faculty = getAuthenticatedFaculty(facultyEmail);
        Long departmentId = faculty.getDepartment().getId();

        return placementDriveRepository.findByAllowedDepartmentId(departmentId)
                .stream()
                .map(this::mapDriveToDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public DriveFilterResultDTO filterEligibleStudentsForDrive(Long driveId, String facultyEmail) {
        User faculty = getAuthenticatedFaculty(facultyEmail);
        Long departmentId = faculty.getDepartment().getId();

        PlacementDrive drive = placementDriveRepository.findById(driveId)
                .orElseThrow(() -> new ResourceNotFoundException("Placement drive not found"));

        List<StudentProfile> departmentStudents = studentProfileRepository.findByUserDepartmentId(departmentId);
        Map<Long, DriveApplication> applications = driveApplicationRepository
                .findByDriveIdAndStudentProfileUserDepartmentId(driveId, departmentId)
                .stream()
                .collect(Collectors.toMap(app -> app.getStudentProfile().getId(), app -> app, (a, b) -> a));

        List<FacultyStudentDTO> students = new ArrayList<>();
        Map<Long, List<String>> ineligibleReasons = new java.util.LinkedHashMap<>();

        for (StudentProfile student : departmentStudents) {
            PlacementEligibilityService.EligibilityEvaluation evaluation =
                    placementEligibilityService.evaluate(student, drive);

            if (!evaluation.isEligible()) {
                ineligibleReasons.put(student.getId(), evaluation.getReasons());
            }

            students.add(mapStudentToDTO(student, applications.get(student.getId()), evaluation.isEligible()));
        }

        long totalVerified = departmentStudents.stream()
                .filter(student -> student.getVerificationStatus() == VerificationStatus.VERIFIED)
                .count();

        return DriveFilterResultDTO.builder()
                .drive(mapDriveToDTO(drive))
                .totalVerified(totalVerified)
                .eligibleStudents(students)
                .ineligibleReasons(ineligibleReasons)
                .build();
    }

    @Transactional
    public void toggleFacultyApproval(Long studentId, Long driveId, boolean approved, String facultyEmail) {
        User faculty = getAuthenticatedFaculty(facultyEmail);
        StudentProfile student = studentProfileRepository.findById(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found"));

        if (!student.getUser().getDepartment().getId().equals(faculty.getDepartment().getId())) {
            throw new UnauthorizedActionException("Cannot approve student from different department");
        }

        PlacementDrive drive = placementDriveRepository.findById(driveId)
                .orElseThrow(() -> new ResourceNotFoundException("Drive not found"));

        PlacementEligibilityService.EligibilityEvaluation evaluation =
                placementEligibilityService.evaluate(student, drive);
        if (!evaluation.isEligible()) {
            throw new IllegalArgumentException(evaluation.getPrimaryReason());
        }

        DriveApplication application = driveApplicationRepository
                .findByStudentProfileIdAndDriveId(studentId, driveId)
                .orElseThrow(() -> new IllegalArgumentException("Student must apply for the drive before faculty approval."));

        application.setFacultyApproved(approved);
        application.setLastUpdatedAt(LocalDateTime.now());
        application.setLastUpdatedBy(faculty);
        driveApplicationRepository.save(application);
    }

    @Transactional
    public void updateApplicationStage(Long studentId, Long driveId, String stage, String actorEmail) {
        User actor = userRepository.findByEmail(actorEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        StudentProfile student = studentProfileRepository.findById(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found"));

        if (actor.getRole() == Role.FACULTY
                && !student.getUser().getDepartment().getId().equals(actor.getDepartment().getId())) {
            throw new UnauthorizedActionException("Faculty cannot update student from different department");
        }

        ApplicationStage targetStage = ApplicationStage.valueOf(stage);
        if (actor.getRole() == Role.FACULTY && targetStage == ApplicationStage.SELECTED) {
            throw new UnauthorizedActionException("Faculty cannot mark students as SELECTED. Only Placement Head can do this.");
        }

        DriveApplication application = driveApplicationRepository
                .findByStudentProfileIdAndDriveId(studentId, driveId)
                .orElseThrow(() -> new ResourceNotFoundException("Application not found for this student and drive"));

        if (actor.getRole() == Role.FACULTY && !Boolean.TRUE.equals(application.getFacultyApproved())) {
            throw new UnauthorizedActionException("Faculty can only move forward students who are faculty-approved.");
        }

        application.setStage(targetStage);
        application.setLastUpdatedAt(LocalDateTime.now());
        application.setLastUpdatedBy(actor);
        driveApplicationRepository.save(application);
    }

    private User getAuthenticatedFaculty(String email) {
        User faculty = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Faculty not found"));

        if (faculty.getDepartment() == null) {
            throw new UnauthorizedActionException("Faculty is not assigned to any department");
        }

        return faculty;
    }

    private FacultyDriveDTO mapDriveToDTO(PlacementDrive drive) {
        return FacultyDriveDTO.builder()
                .id(drive.getId())
                .companyName(drive.getCompany() != null ? drive.getCompany().getName() : "N/A")
                .title(drive.getTitle())
                .role(drive.getRole())
                .ctcLpa(drive.getCtcLpa())
                .status(drive.getStatus().name())
                .eligibilityCriteria(mapCriteriaToDTO(drive.getEligibilityCriteria()))
                .build();
    }

    private EligibilityCriteriaDTO mapCriteriaToDTO(EligibilityCriteria criteria) {
        if (criteria == null) {
            return EligibilityCriteriaDTO.builder()
                    .minCgpa(0.0)
                    .maxStandingArrears(99)
                    .maxHistoryOfArrears(99)
                    .allowedDepartments(new ArrayList<>())
                    .allowedGraduationYears(new ArrayList<>())
                    .requiredSkills(new ArrayList<>())
                    .build();
        }

        return EligibilityCriteriaDTO.builder()
                .minCgpa(criteria.getMinCgpa())
                .maxStandingArrears(criteria.getMaxStandingArrears())
                .maxHistoryOfArrears(criteria.getMaxHistoryOfArrears())
                .allowedDepartments(criteria.getAllowedDepartments() != null
                        ? criteria.getAllowedDepartments().stream().map(Department::getName).collect(Collectors.toList())
                        : new ArrayList<>())
                .allowedGraduationYears(criteria.getGraduationYear() != null
                        ? List.of(criteria.getGraduationYear())
                        : new ArrayList<>())
                .requiredSkills(criteria.getRequiredSkills() != null ? criteria.getRequiredSkills() : new ArrayList<>())
                .build();
    }

    private FacultyStudentDTO mapStudentToDTO(StudentProfile student, DriveApplication application, boolean eligible) {
        String fullName = student.getUser().getEmail();
        if (student.getPersonalDetails() != null && student.getPersonalDetails().getFirstName() != null
                && !student.getPersonalDetails().getFirstName().isBlank()) {
            String firstName = student.getPersonalDetails().getFirstName().trim();
            String lastName = student.getPersonalDetails().getLastName() != null
                    ? student.getPersonalDetails().getLastName().trim()
                    : "";
            fullName = (firstName + " " + lastName).trim();
        }

        return FacultyStudentDTO.builder()
                .id(student.getId())
                .userId(student.getUser().getId())
                .rollNo(student.getRollNo())
                .batch(student.getBatch())
                .name(fullName)
                .email(student.getUser().getEmail())
                .verificationStatus(student.getVerificationStatus() != null
                        ? student.getVerificationStatus().name()
                        : VerificationStatus.PENDING.name())
                .isLocked(Boolean.TRUE.equals(student.getIsLocked()))
                .isEligibleForPlacements(eligible)
                .eligibleForAdminReview(Boolean.TRUE.equals(student.getEligibleForAdminReview()))
                .isPlaced(Boolean.TRUE.equals(student.getIsPlaced()))
                .numberOfOffers(student.getNumberOfOffers() != null ? student.getNumberOfOffers() : 0)
                .highestPackageLpa(student.getHighestPackageLpa() != null ? student.getHighestPackageLpa() : 0.0)
                .cgpa(student.getAcademicRecord() != null ? student.getAcademicRecord().getCgpa() : null)
                .standingArrears(student.getAcademicRecord() != null ? student.getAcademicRecord().getStandingArrears() : 0)
                .historyOfArrears(student.getAcademicRecord() != null ? student.getAcademicRecord().getHistoryOfArrears() : 0)
                .facultyApproved(application != null && Boolean.TRUE.equals(application.getFacultyApproved()))
                .currentStage(application != null && application.getStage() != null ? application.getStage().name() : null)
                .hasApplied(application != null)
                .department(student.getUser().getDepartment() != null ? student.getUser().getDepartment().getName() : null)
                .graduationYear(student.getAcademicRecord() != null ? student.getAcademicRecord().getUgYearOfPass() : null)
                .profileCompletionPercentage(studentProfileService.calculateCompletionPercentage(student))
                .phoneNumber(student.getContactDetails() != null ? student.getContactDetails().getStudentMobile1() : null)
                .linkedinUrl(student.getProfessionalProfile() != null ? student.getProfessionalProfile().getLinkedinProfileUrl() : null)
                .githubUrl(student.getProfessionalProfile() != null ? student.getProfessionalProfile().getGithubProfileUrl() : null)
                .skills(student.getSkills() != null
                        ? student.getSkills().stream().map(StudentSkill::getSkillName).collect(Collectors.toList())
                        : List.of())
                .build();
    }
}
