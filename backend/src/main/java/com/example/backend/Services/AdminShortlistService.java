package com.example.backend.Services;

import com.example.backend.DTOs.Admin.DriveApplicationDTO;
import com.example.backend.DTOs.Admin.ShortlistRequestDTO;
import com.example.backend.Exceptions.ResourceNotFoundException;
import com.example.backend.Models.DriveApplication;
import com.example.backend.Models.User;
import com.example.backend.Models.enums.ApplicationStage;
import com.example.backend.Repositories.DriveApplicationRepository;
import com.example.backend.Repositories.PlacementDriveRepository;
import com.example.backend.Repositories.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class AdminShortlistService {

    @Autowired
    private DriveApplicationRepository driveApplicationRepository;

    @Autowired
    private PlacementDriveRepository placementDriveRepository;

    @Autowired
    private UserRepository userRepository;

    public List<DriveApplicationDTO> getEligibleApplicants(Long driveId) {
        if (!placementDriveRepository.existsById(driveId)) {
            throw new ResourceNotFoundException("Placement Drive not found");
        }

        List<DriveApplication> applications = driveApplicationRepository.findByDriveId(driveId).stream()
                .filter(app -> Boolean.TRUE.equals(app.getFacultyApproved()))
                .filter(app -> app.getStage() != ApplicationStage.REJECTED)
                .collect(Collectors.toList());
        return applications.stream().map(this::mapToDTO).collect(Collectors.toList());
    }

    public List<DriveApplicationDTO> getFacultyApprovedApplicants(Long driveId) {
        return getEligibleApplicants(driveId);
    }

    public List<DriveApplicationDTO> generateShortlist(Long driveId, ShortlistRequestDTO request, String adminEmail) {
        if (!placementDriveRepository.existsById(driveId)) {
            throw new ResourceNotFoundException("Placement Drive not found");
        }

        User admin = userRepository.findByEmail(adminEmail).orElse(null);

        List<DriveApplication> applications = driveApplicationRepository.findAllById(request.getApplicationIds());

        applications.forEach(app -> {
            if (app.getDrive().getId().equals(driveId) && app.getStage() == ApplicationStage.APPLIED) {
                app.setStage(ApplicationStage.ASSESSMENT);
                app.setLastUpdatedAt(LocalDateTime.now());
                if (admin != null) {
                    app.setLastUpdatedBy(admin);
                }
            }
        });

        List<DriveApplication> updated = driveApplicationRepository.saveAll(applications);
        return updated.stream().map(this::mapToDTO).collect(Collectors.toList());
    }

    private DriveApplicationDTO mapToDTO(DriveApplication app) {
        String studentName = app.getStudentProfile().getUser().getEmail();
        if (app.getStudentProfile().getPersonalDetails() != null
                && app.getStudentProfile().getPersonalDetails().getFirstName() != null
                && !app.getStudentProfile().getPersonalDetails().getFirstName().isBlank()) {
            String firstName = app.getStudentProfile().getPersonalDetails().getFirstName().trim();
            String lastName = app.getStudentProfile().getPersonalDetails().getLastName() != null
                    ? app.getStudentProfile().getPersonalDetails().getLastName().trim()
                    : "";
            studentName = (firstName + " " + lastName).trim();
        }

        return DriveApplicationDTO.builder()
                .id(app.getId())
                .studentId(app.getStudentProfile().getId())
                .studentName(studentName)
                .rollNo(app.getStudentProfile().getRollNo())
                .departmentName(app.getStudentProfile().getUser().getDepartment() != null
                        ? app.getStudentProfile().getUser().getDepartment().getName()
                        : "N/A")
                .cgpa(app.getStudentProfile().getAcademicRecord() != null
                        ? app.getStudentProfile().getAcademicRecord().getCgpa()
                        : 0.0)
                .stage(app.getStage())
                .build();
    }
}
