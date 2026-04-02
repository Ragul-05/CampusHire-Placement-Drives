package com.example.backend.Services;

import com.example.backend.DTOs.Faculty.FacultyApplicationDTO;
import com.example.backend.DTOs.Faculty.StageUpdateRequestDTO;
import com.example.backend.Exceptions.ResourceNotFoundException;
import com.example.backend.Exceptions.UnauthorizedActionException;
import com.example.backend.Models.DriveApplication;
import com.example.backend.Models.User;
import com.example.backend.Models.enums.ApplicationStage;
import com.example.backend.Repositories.DriveApplicationRepository;
import com.example.backend.Repositories.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class FacultyApplicationService {

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

    public List<FacultyApplicationDTO> getDepartmentApplications(String facultyEmail) {
        User faculty = getAuthenticatedFaculty(facultyEmail);
        Long departmentId = faculty.getDepartment().getId();

        List<DriveApplication> applications = driveApplicationRepository
                .findByStudentProfileUserDepartmentId(departmentId);

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

    public void updateApplicationStage(Long applicationId, StageUpdateRequestDTO request, String facultyEmail) {
        User faculty = getAuthenticatedFaculty(facultyEmail);

        DriveApplication application = driveApplicationRepository.findById(applicationId)
                .orElseThrow(() -> new ResourceNotFoundException("Application not found"));

        if (!application.getStudentProfile().getUser().getDepartment().getId()
                .equals(faculty.getDepartment().getId())) {
            throw new UnauthorizedActionException("Cannot update application for student in another department");
        }

        ApplicationStage targetStage = request.getTargetStage();
        ApplicationStage currentStage = application.getStage();

        // Admin-only stages checking
        if (targetStage == ApplicationStage.SELECTED || targetStage == ApplicationStage.REJECTED) {
            throw new UnauthorizedActionException(
                    "Faculty cannot mark application as SELECTED or REJECTED. This is Admin only.");
        }

        // Sequential validation rules (Optional strictness, but good for data
        // integrity)
        if (!isValidTransition(currentStage, targetStage)) {
            throw new IllegalArgumentException("Invalid stage transition from " + currentStage + " to " + targetStage);
        }

        application.setStage(targetStage);
        application.setLastUpdatedAt(LocalDateTime.now());
        // REMARKS: In a full system we might track StageUpdate logs, but updating the
        // column is enough per schema.

        driveApplicationRepository.save(application);
    }

    private boolean isValidTransition(ApplicationStage current, ApplicationStage target) {
        if (current == target)
            return false;

        // Allowed transitions
        if (current == ApplicationStage.ELIGIBLE && target == ApplicationStage.ASSESSMENT)
            return true;
        if (current == ApplicationStage.APPLIED && target == ApplicationStage.ASSESSMENT)
            return true;
        if (current == ApplicationStage.ASSESSMENT && target == ApplicationStage.TECHNICAL)
            return true;
        if (current == ApplicationStage.TECHNICAL && target == ApplicationStage.HR)
            return true;

        // Allows skipping forward if needed? "strictly sequential manner without
        // skipping stages" -> Yes, strict.
        return false;
    }
}
