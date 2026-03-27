package com.example.backend.Services;

import com.example.backend.DTOs.Faculty.EligibilityCriteriaDTO;
import com.example.backend.DTOs.Faculty.FacultyDriveDTO;
import com.example.backend.DTOs.Faculty.FacultyStudentDTO;
import com.example.backend.DTOs.Faculty.DriveFilterResultDTO;
import com.example.backend.Exceptions.ResourceNotFoundException;
import com.example.backend.Exceptions.UnauthorizedActionException;
import com.example.backend.Models.*;
import com.example.backend.Models.enums.ApplicationStage;
import com.example.backend.Models.enums.DriveStatus;
import com.example.backend.Models.enums.VerificationStatus;
import com.example.backend.Repositories.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
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
    private FacultyStudentService facultyStudentService;

    public List<FacultyDriveDTO> getActiveDrivesForFaculty(String facultyEmail) {
        User faculty = userRepository.findByEmail(facultyEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Faculty not found"));

        if (faculty.getDepartment() == null) {
            throw new UnauthorizedActionException("Faculty is not assigned to any department");
        }

        Long departmentId = faculty.getDepartment().getId();

        // Get drives that are UPCOMING or ONGOING for the faculty's department
        List<PlacementDrive> drives = placementDriveRepository
                .findByStatusInAndAllowedDepartmentId(
                        Arrays.asList(DriveStatus.UPCOMING, DriveStatus.ONGOING),
                        departmentId);

        return drives.stream()
                .map(this::mapDriveToDTO)
                .collect(Collectors.toList());
    }

    public List<FacultyDriveDTO> getAllDrivesForFaculty(String facultyEmail) {
        User faculty = userRepository.findByEmail(facultyEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Faculty not found"));

        if (faculty.getDepartment() == null) {
            throw new UnauthorizedActionException("Faculty is not assigned to any department");
        }

        Long departmentId = faculty.getDepartment().getId();
        List<PlacementDrive> drives = placementDriveRepository.findByAllowedDepartmentId(departmentId);

        return drives.stream()
                .map(this::mapDriveToDTO)
                .collect(Collectors.toList());
    }

    public DriveFilterResultDTO filterEligibleStudentsForDrive(
            Long driveId, String facultyEmail) {

        User faculty = userRepository.findByEmail(facultyEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Faculty not found"));

        if (faculty.getDepartment() == null) {
            throw new UnauthorizedActionException("Faculty is not assigned to any department");
        }

        PlacementDrive drive = placementDriveRepository.findById(driveId)
                .orElseThrow(() -> new ResourceNotFoundException("Placement drive not found"));

        Long departmentId = faculty.getDepartment().getId();

        // Get all verified students from the department
        List<StudentProfile> verifiedStudents = studentProfileRepository
                .findByUserDepartmentIdAndVerificationStatus(departmentId, VerificationStatus.VERIFIED);

        long totalVerified = verifiedStudents.size();

        List<FacultyStudentDTO> eligibleStudents = new ArrayList<>();
        Map<Long, List<String>> ineligibleReasons = new HashMap<>();
        EligibilityCriteria criteria = drive.getEligibilityCriteria();

        for (StudentProfile student : verifiedStudents) {
            List<String> reasons = new ArrayList<>();
            if (criteria != null) {
                if (student.getAcademicRecord() != null) {
                    if (student.getAcademicRecord().getCgpa() < criteria.getMinCgpa()) {
                        reasons.add("CGPA below minimum: " + student.getAcademicRecord().getCgpa() + " < " + criteria.getMinCgpa());
                    }
                    if (student.getAcademicRecord().getStandingArrears() > criteria.getMaxStandingArrears()) {
                        reasons.add("Standing arrears exceed limit: " + student.getAcademicRecord().getStandingArrears() + " > " + criteria.getMaxStandingArrears());
                    }
                    if (student.getAcademicRecord().getHistoryOfArrears() > criteria.getMaxHistoryOfArrears()) {
                        reasons.add("History of arrears exceed limit: " + student.getAcademicRecord().getHistoryOfArrears() + " > " + criteria.getMaxHistoryOfArrears());
                    }
                    if (criteria.getGraduationYear() != null &&
                        !criteria.getGraduationYear().equals(student.getAcademicRecord().getUgYearOfPass())) {
                        reasons.add("Graduation year not allowed: " + student.getAcademicRecord().getUgYearOfPass());
                    }
                } else {
                    reasons.add("Academic record not available");
                }
            }

            if (!Boolean.TRUE.equals(student.getIsEligibleForPlacements())) {
                reasons.add("Not marked as eligible for placements");
            }

            FacultyStudentDTO dto = mapStudentToDTO(student, driveId);
            eligibleStudents.add(dto);
            if (!reasons.isEmpty()) {
                ineligibleReasons.put(student.getId(), reasons);
            }
        }

        return DriveFilterResultDTO.builder()
                .drive(mapDriveToDTO(drive))
                .totalVerified(totalVerified)
                .eligibleStudents(eligibleStudents)
                .ineligibleReasons(ineligibleReasons)
                .build();
    }

    @Transactional
    public void toggleFacultyApproval(Long studentId, Long driveId, boolean approved, String facultyEmail) {
        User faculty = userRepository.findByEmail(facultyEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Faculty not found"));

        StudentProfile student = studentProfileRepository.findById(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found"));

        // Verify faculty can update this student
        if (!student.getUser().getDepartment().getId().equals(faculty.getDepartment().getId())) {
            throw new UnauthorizedActionException("Cannot approve student from different department");
        }

        DriveApplication application = driveApplicationRepository
                .findByStudentProfileIdAndDriveId(studentId, driveId)
                .orElseGet(() -> {
                    PlacementDrive drive = placementDriveRepository.findById(driveId)
                            .orElseThrow(() -> new ResourceNotFoundException("Drive not found"));
                    return DriveApplication.builder()
                            .studentProfile(student)
                            .drive(drive)
                            .stage(ApplicationStage.APPLIED)
                            .appliedAt(java.time.LocalDateTime.now())
                            .build();
                });

        application.setFacultyApproved(approved);
        application.setLastUpdatedAt(java.time.LocalDateTime.now());
        application.setLastUpdatedBy(faculty);
        driveApplicationRepository.save(application);
    }

    @Transactional
    public void updateApplicationStage(Long studentId, Long driveId, String stage, String actorEmail) {
        User actor = userRepository.findByEmail(actorEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        StudentProfile student = studentProfileRepository.findById(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found"));

        // Faculty check
        if (actor.getRole() == com.example.backend.Models.enums.Role.FACULTY) {
            if (!student.getUser().getDepartment().getId().equals(actor.getDepartment().getId())) {
                throw new UnauthorizedActionException("Faculty cannot update student from different department");
            }
            if ("SELECTED".equals(stage)) {
                throw new UnauthorizedActionException("Faculty cannot mark students as SELECTED. Only Placement Head can do this.");
            }
        }

        // Find or create application
        Optional<DriveApplication> existingApp = driveApplicationRepository
                .findByStudentProfileIdAndDriveId(studentId, driveId);

        DriveApplication application;
        if (existingApp.isPresent()) {
            application = existingApp.get();
            application.setStage(ApplicationStage.valueOf(stage));
        } else {
            // Create new application
            PlacementDrive drive = placementDriveRepository.findById(driveId)
                    .orElseThrow(() -> new ResourceNotFoundException("Drive not found"));

            application = DriveApplication.builder()
                    .studentProfile(student)
                    .drive(drive)
                    .stage(ApplicationStage.valueOf(stage))
                    .build();
        }

        driveApplicationRepository.save(application);
    }

    private FacultyDriveDTO mapDriveToDTO(PlacementDrive drive) {
        return FacultyDriveDTO.builder()
                .id(drive.getId())
                .companyName(drive.getCompany() != null ? drive.getCompany().getName() : "N/A")
                .title(drive.getTitle())
                .role(drive.getRole())
                .ctcLpa(drive.getCtcLpa())
                .status(drive.getStatus().toString())
                .eligibilityCriteria(mapCriteriaToDTO(drive.getEligibilityCriteria()))
                .build();
    }

    private EligibilityCriteriaDTO mapCriteriaToDTO(EligibilityCriteria ec) {
        if (ec == null) {
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
                .minCgpa(ec.getMinCgpa())
                .maxStandingArrears(ec.getMaxStandingArrears())
                .maxHistoryOfArrears(ec.getMaxHistoryOfArrears())
                .allowedDepartments(ec.getAllowedDepartments() != null ?
                        ec.getAllowedDepartments().stream()
                            .map(Department::getName)
                            .collect(Collectors.toList()) : new ArrayList<>())
                .allowedGraduationYears(ec.getGraduationYear() != null ?
                        List.of(ec.getGraduationYear()) : new ArrayList<>())
                .requiredSkills(ec.getRequiredSkills() != null ?
                        ec.getRequiredSkills() : new ArrayList<>())
                .build();
    }

    private FacultyStudentDTO mapStudentToDTO(StudentProfile student, Long driveId) {
        Optional<DriveApplication> app = driveApplicationRepository.findByStudentProfileIdAndDriveId(student.getId(), driveId);

        String fullName = student.getUser().getEmail();
        if (student.getPersonalDetails() != null) {
            String f = student.getPersonalDetails().getFirstName();
            String l = student.getPersonalDetails().getLastName();
            if (f != null && !f.trim().isEmpty()) {
                fullName = f + (l != null ? " " + l : "");
            }
        }

        return FacultyStudentDTO.builder()
                .id(student.getId())
                .userId(student.getUser().getId())
                .rollNo(student.getRollNo())
                .batch(student.getBatch())
                .name(fullName)
                .email(student.getUser().getEmail())
                .verificationStatus(student.getVerificationStatus().toString())
                .isLocked(student.getIsLocked())
                .isEligibleForPlacements(student.getIsEligibleForPlacements())
                .isPlaced(student.getIsPlaced())
                .numberOfOffers(student.getNumberOfOffers())
                .highestPackageLpa(student.getHighestPackageLpa())
                .cgpa(student.getAcademicRecord() != null ? student.getAcademicRecord().getCgpa() : null)
                .standingArrears(student.getAcademicRecord() != null ? student.getAcademicRecord().getStandingArrears() : 0)
                .historyOfArrears(student.getAcademicRecord() != null ? student.getAcademicRecord().getHistoryOfArrears() : 0)
                .facultyApproved(app.map(DriveApplication::getFacultyApproved).orElse(false))
                .currentStage(app.map(a -> a.getStage().toString()).orElse(null))
                .department(student.getUser().getDepartment() != null ? student.getUser().getDepartment().getName() : null)
                .graduationYear(student.getAcademicRecord() != null ? student.getAcademicRecord().getUgYearOfPass() : null)
                .skills(student.getSkills() != null ? 
                    student.getSkills().stream().map(StudentSkill::getSkillName).collect(Collectors.toList()) : 
                    new ArrayList<>())
                .build();
    }
}
