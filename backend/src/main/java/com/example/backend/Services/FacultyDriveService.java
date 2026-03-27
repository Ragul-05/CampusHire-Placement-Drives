package com.example.backend.Services;

import com.example.backend.DTOs.Faculty.FacultyApplicationDTO;
import com.example.backend.DTOs.Faculty.FacultyDriveDTO;
import com.example.backend.DTOs.Faculty.EligibilityCriteriaDTO;
import com.example.backend.Exceptions.ResourceNotFoundException;
import com.example.backend.Exceptions.UnauthorizedActionException;
import com.example.backend.Models.Department;
import com.example.backend.Models.DriveApplication;
import com.example.backend.Models.EligibilityCriteria;
import com.example.backend.Models.PlacementDrive;
import com.example.backend.Models.User;
import com.example.backend.Models.enums.ApplicationStage;
import com.example.backend.Models.enums.DriveStatus;
import com.example.backend.Repositories.DriveApplicationRepository;
import com.example.backend.Repositories.PlacementDriveRepository;
import com.example.backend.Repositories.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class FacultyDriveService {

    @Autowired
    private PlacementDriveRepository placementDriveRepository;

    @Autowired
    private DriveApplicationRepository driveApplicationRepository;

    @Autowired
    private UserRepository userRepository;

    private User getAuthenticatedFaculty(String email) {
        User faculty = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Faculty not found"));
        if (faculty.getDepartment() == null) {
            throw new UnauthorizedActionException("Faculty is not assigned to any department");
        }
        return faculty;
    }

    public List<FacultyDriveDTO> getDepartmentDrives(String facultyEmail, List<DriveStatus> statuses) {
        User faculty = getAuthenticatedFaculty(facultyEmail);
        Long departmentId = faculty.getDepartment().getId();

        List<PlacementDrive> drives;
        if (statuses == null || statuses.isEmpty()) {
            drives = placementDriveRepository.findByAllowedDepartmentId(departmentId);
        } else {
            drives = placementDriveRepository.findByAllowedDepartmentIdAndStatusIn(departmentId, statuses);
        }

        return drives.stream().map(drive -> {
            long totalApplicants = driveApplicationRepository
                    .countByDriveIdAndStudentProfileUserDepartmentId(drive.getId(), departmentId);
            // Count selected students for this department
            long selectedApplicants = driveApplicationRepository
                    .findByDriveIdAndStudentProfileUserDepartmentId(drive.getId(), departmentId)
                    .stream()
                    .filter(app -> app.getStage() == ApplicationStage.SELECTED)
                    .count();

            return FacultyDriveDTO.builder()
                    .id(drive.getId())
                    .companyName(drive.getCompany().getName())
                    .title(drive.getTitle())
                    .role(drive.getRole())
                    .ctcLpa(drive.getCtcLpa())
                    .status(drive.getStatus().name())
                    .totalDepartmentApplicants(totalApplicants)
                    .selectedDepartmentApplicants(selectedApplicants)
                    .eligibilityCriteria(mapCriteriaToDTO(drive.getEligibilityCriteria()))
                    .build();
        }).collect(Collectors.toList());
    }

    private EligibilityCriteriaDTO mapCriteriaToDTO(EligibilityCriteria ec) {
        if (ec == null) return null;
        return EligibilityCriteriaDTO.builder()
                .minCgpa(ec.getMinCgpa())
                .maxStandingArrears(ec.getMaxStandingArrears())
                .maxHistoryOfArrears(ec.getMaxHistoryOfArrears())
                .allowedDepartments(ec.getAllowedDepartments() != null ?
                        ec.getAllowedDepartments().stream().map(Department::getName).collect(Collectors.toList()) : null)
                .allowedGraduationYears(ec.getGraduationYear() != null ? List.of(ec.getGraduationYear()) : null)
                .requiredSkills(ec.getRequiredSkills())
                .build();
    }

    public List<FacultyApplicationDTO> getDriveParticipants(Long driveId, String facultyEmail) {
        User faculty = getAuthenticatedFaculty(facultyEmail);
        Long departmentId = faculty.getDepartment().getId();

        // Ensure drive exists
        if (!placementDriveRepository.existsById(driveId)) {
            throw new ResourceNotFoundException("Placement Drive not found");
        }

        // We could also check if this drive actually allows this department, but if
        // students applied, they must have been allowed. Find the applications:
        List<DriveApplication> applications = driveApplicationRepository
                .findByDriveIdAndStudentProfileUserDepartmentId(driveId, departmentId);

        return applications.stream().map(app -> FacultyApplicationDTO.builder()
                .id(app.getId())
                .studentId(app.getStudentProfile().getId())
                .studentName(app.getStudentProfile().getUser().getEmail())
                .rollNo(app.getStudentProfile().getRollNo())
                .driveId(app.getDrive().getId())
                .companyName(app.getDrive().getCompany().getName())
                .driveRole(app.getDrive().getRole())
                .stage(app.getStage())
                .appliedAt(app.getAppliedAt())
                .lastUpdatedAt(app.getLastUpdatedAt())
                .build()).collect(Collectors.toList());
    }
}
