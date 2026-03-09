package com.example.backend.Services;

import com.example.backend.Controllers.FacultyDriveFilteringController;
import com.example.backend.DTOs.Faculty.FacultyStudentDTO;
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

    public List<Object> getActiveDrivesForFaculty(String facultyEmail) {
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

    public FacultyDriveFilteringController.DriveFilterResult filterEligibleStudentsForDrive(
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
        if (criteria == null) {
            // No criteria, all verified students are eligible
            for (StudentProfile student : verifiedStudents) {
                FacultyStudentDTO dto = mapStudentToDTO(student, driveId);
                eligibleStudents.add(dto);
            }
        } else {
            for (StudentProfile student : verifiedStudents) {
                List<String> reasons = new ArrayList<>();

                if (student.getAcademicRecord() != null) {
                    // Check CGPA
                    if (student.getAcademicRecord().getCgpa() < criteria.getMinCgpa()) {
                        reasons.add("CGPA below minimum: " + student.getAcademicRecord().getCgpa() + " < " + criteria.getMinCgpa());
                    }

                    // Check standing arrears
                    if (student.getAcademicRecord().getStandingArrears() > criteria.getMaxStandingArrears()) {
                        reasons.add("Standing arrears exceed limit: " + student.getAcademicRecord().getStandingArrears() + " > " + criteria.getMaxStandingArrears());
                    }

                    // Check history of arrears
                    if (student.getAcademicRecord().getHistoryOfArrears() > criteria.getMaxHistoryOfArrears()) {
                        reasons.add("History of arrears exceed limit: " + student.getAcademicRecord().getHistoryOfArrears() + " > " + criteria.getMaxHistoryOfArrears());
                    }

                    // Check graduation year
                    if (criteria.getGraduationYear() != null &&
                        !criteria.getGraduationYear().equals(student.getAcademicRecord().getUgYearOfPass())) {
                        reasons.add("Graduation year not allowed: " + student.getAcademicRecord().getUgYearOfPass());
                    }
                } else {
                    reasons.add("Academic record not available");
                }

                // Check if eligible for placements
                if (!Boolean.TRUE.equals(student.getIsEligibleForPlacements())) {
                    reasons.add("Not marked as eligible for placements");
                }

                if (reasons.isEmpty()) {
                    // Student is eligible
                    FacultyStudentDTO dto = mapStudentToDTO(student, driveId);
                    eligibleStudents.add(dto);
                } else {
                    ineligibleReasons.put(student.getId(), reasons);
                }
            }
        }

        return FacultyDriveFilteringController.DriveFilterResult.builder()
                .drive(mapDriveToDTO(drive))
                .totalVerified(totalVerified)
                .eligibleStudents(eligibleStudents)
                .ineligibleReasons(ineligibleReasons)
                .build();
    }

    @Transactional
    public void updateApplicationStage(Long studentId, Long driveId, String stage, String facultyEmail) {
        User faculty = userRepository.findByEmail(facultyEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Faculty not found"));

        StudentProfile student = studentProfileRepository.findById(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found"));

        // Verify faculty can update this student
        if (!student.getUser().getDepartment().getId().equals(faculty.getDepartment().getId())) {
            throw new UnauthorizedActionException("Cannot update student from different department");
        }

        // Faculty cannot mark as SELECTED - that's placement head's role
        if ("SELECTED".equals(stage)) {
            throw new UnauthorizedActionException("Faculty cannot mark students as SELECTED");
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

    private Object mapDriveToDTO(PlacementDrive drive) {
        Map<String, Object> dto = new HashMap<>();
        dto.put("id", drive.getId());

        String jobTitle = drive.getTitle() != null ? drive.getTitle() : drive.getRole();
        dto.put("jobTitle", jobTitle);
        dto.put("companyName", drive.getCompany() != null ? drive.getCompany().getName() : "N/A");
        dto.put("ctcLpa", drive.getCtcLpa());
        dto.put("status", drive.getStatus().toString());

        Map<String, Object> criteria = new HashMap<>();
        EligibilityCriteria ec = drive.getEligibilityCriteria();

        if (ec != null) {
            criteria.put("minCgpa", ec.getMinCgpa());
            criteria.put("maxStandingArrears", ec.getMaxStandingArrears());
            criteria.put("maxHistoryOfArrears", ec.getMaxHistoryOfArrears());
            criteria.put("allowedDepartments", ec.getAllowedDepartments() != null ?
                    ec.getAllowedDepartments().stream()
                        .map(Department::getName)
                        .collect(Collectors.toList()) : new ArrayList<>());
            criteria.put("allowedGraduationYears", ec.getGraduationYear() != null ?
                    List.of(ec.getGraduationYear()) : new ArrayList<>());
            criteria.put("requiredSkills", ec.getRequiredSkills() != null ?
                    ec.getRequiredSkills() : new ArrayList<>());
        } else {
            criteria.put("minCgpa", 0.0);
            criteria.put("maxStandingArrears", 99);
            criteria.put("maxHistoryOfArrears", 99);
            criteria.put("allowedDepartments", new ArrayList<>());
            criteria.put("allowedGraduationYears", new ArrayList<>());
            criteria.put("requiredSkills", new ArrayList<>());
        }

        dto.put("eligibilityCriteria", criteria);

        return dto;
    }

    private FacultyStudentDTO mapStudentToDTO(StudentProfile student, Long driveId) {

        // TODO: Implement skills retrieval when skills table/field is added
        List<String> skills = new ArrayList<>();

        return FacultyStudentDTO.builder()
                .id(student.getId())
                .userId(student.getUser().getId())
                .rollNo(student.getRollNo())
                .batch(student.getBatch())
                .name(student.getUser().getEmail()) // Using email as name since User doesn't have firstName/lastName
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
                .skills(skills)
                .build();
    }
}
