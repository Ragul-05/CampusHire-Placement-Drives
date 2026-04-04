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

    @Autowired
    private DriveEligibilitySyncService driveEligibilitySyncService;

    public List<FacultyDriveDTO> getActiveDrivesForFaculty(String facultyEmail) {
        User faculty = getAuthenticatedFaculty(facultyEmail);
        Long departmentId = faculty.getDepartment().getId();

        return placementDriveRepository.findAll().stream()
                .filter(drive -> List.of(DriveStatus.UPCOMING, DriveStatus.ONGOING).contains(drive.getStatus()))
                .filter(drive -> isDriveVisibleToDepartment(drive, departmentId))
                .map(this::mapDriveToDTO)
                .collect(Collectors.toList());
    }

    public List<FacultyDriveDTO> getAllDrivesForFaculty(String facultyEmail) {
        User faculty = getAuthenticatedFaculty(facultyEmail);
        Long departmentId = faculty.getDepartment().getId();

        return placementDriveRepository.findAll().stream()
                .filter(drive -> isDriveVisibleToDepartment(drive, departmentId))
                .map(this::mapDriveToDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public DriveFilterResultDTO filterEligibleStudentsForDrive(Long driveId, String facultyEmail) {
        getAuthenticatedFaculty(facultyEmail);

        PlacementDrive drive = placementDriveRepository.findById(driveId)
                .orElseThrow(() -> new ResourceNotFoundException("Placement drive not found"));

        driveEligibilitySyncService.syncEligibleMappingsForDrive(drive);

        List<DriveApplication> driveApplications = driveApplicationRepository.findByDriveId(driveId);
        List<FacultyStudentDTO> students = new ArrayList<>();
        Map<Long, List<String>> ineligibleReasons = new java.util.LinkedHashMap<>();

        for (DriveApplication application : driveApplications) {
            StudentProfile student = application.getStudentProfile();
            PlacementEligibilityService.EligibilityEvaluation evaluation = placementEligibilityService.evaluate(student, drive);
            if (!evaluation.isEligible()) {
                ineligibleReasons.put(student.getId(), evaluation.getReasons());
            }
            students.add(mapStudentToDTO(student, application, evaluation.isEligible()));
        }

        return DriveFilterResultDTO.builder()
                .drive(mapDriveToDTO(drive))
                .totalVerified((long) driveApplications.stream()
                        .filter(application -> application.getStudentProfile().getVerificationStatus() == VerificationStatus.VERIFIED)
                        .count())
                .totalStudents((long) driveApplications.size())
                .eligibleStudents(students)
                .ineligibleReasons(ineligibleReasons)
                .build();
    }

    @Transactional
    public void toggleFacultyApproval(Long studentId, Long driveId, boolean approved, String facultyEmail) {
        User faculty = getAuthenticatedFaculty(facultyEmail);
        StudentProfile student = studentProfileRepository.findById(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found"));

        PlacementDrive drive = placementDriveRepository.findById(driveId)
                .orElseThrow(() -> new ResourceNotFoundException("Drive not found"));

        PlacementEligibilityService.EligibilityEvaluation evaluation =
                placementEligibilityService.evaluate(student, drive);
        if (!evaluation.isEligible()) {
            throw new IllegalArgumentException(evaluation.getPrimaryReason());
        }

        driveEligibilitySyncService.syncEligibleMappingsForDrive(drive);
        DriveApplication application = driveApplicationRepository
                .findByStudentProfileIdAndDriveId(studentId, driveId)
                .orElseThrow(() -> new IllegalArgumentException("Eligible student mapping was not found for this drive."));

        application.setFacultyApproved(approved);
        if (!approved) {
            application.setSubmittedToAdmin(false);
        }
        application.setLastUpdatedAt(LocalDateTime.now());
        application.setLastUpdatedBy(faculty);
        driveApplicationRepository.save(application);
    }

    @Transactional
    public void toggleFacultyApprovalForStudents(List<Long> studentIds, Long driveId, boolean approved, String facultyEmail) {
        if (studentIds == null || studentIds.isEmpty()) {
            throw new IllegalArgumentException("No students were selected for bulk approval.");
        }

        for (Long studentId : studentIds) {
            toggleFacultyApproval(studentId, driveId, approved, facultyEmail);
        }
    }

    @Transactional
    public void updateApplicationStage(Long studentId, Long driveId, String stage, String actorEmail) {
        User actor = userRepository.findByEmail(actorEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        StudentProfile student = studentProfileRepository.findById(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found"));

        ApplicationStage targetStage;
        try {
            targetStage = ApplicationStage.valueOf(stage.toUpperCase());
        } catch (Exception ex) {
            throw new IllegalArgumentException("Invalid stage value: " + stage);
        }

        if (actor.getRole() == Role.FACULTY &&
                (targetStage == ApplicationStage.SELECTED || targetStage == ApplicationStage.REJECTED)) {
            throw new UnauthorizedActionException("Faculty can update only up to HR stage. Only Placement Head can set final outcomes.");
        }

        PlacementDrive drive = placementDriveRepository.findById(driveId)
                .orElseThrow(() -> new ResourceNotFoundException("Drive not found"));
        driveEligibilitySyncService.syncEligibleMappingsForDrive(drive);

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

        String rollNo = student.getRollNo();
        if (rollNo == null || rollNo.isBlank()) {
            rollNo = student.getUser() != null ? student.getUser().getUniversityRegNo() : null;
        }

        return FacultyStudentDTO.builder()
                .id(student.getId())
                .userId(student.getUser().getId())
                .rollNo(rollNo)
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

    private boolean isDriveVisibleToDepartment(PlacementDrive drive, Long departmentId) {
        if (drive.getEligibilityCriteria() == null
                || drive.getEligibilityCriteria().getAllowedDepartments() == null
                || drive.getEligibilityCriteria().getAllowedDepartments().isEmpty()) {
            return true;
        }

        boolean departmentAllowed = drive.getEligibilityCriteria().getAllowedDepartments().stream()
                .anyMatch(department -> departmentId.equals(department.getId()));
        if (departmentAllowed) {
            return true;
        }

        return !driveApplicationRepository.findByDriveIdAndStudentProfileUserDepartmentId(drive.getId(), departmentId).isEmpty();
    }
}
