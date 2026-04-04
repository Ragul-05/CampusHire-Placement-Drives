package com.example.backend.Services;

import com.example.backend.DTOs.Admin.DriveApplicationDTO;
import com.example.backend.DTOs.Admin.DriveApprovalSummaryDTO;
import com.example.backend.DTOs.Admin.AdminStageUpdateRequestDTO;
import com.example.backend.DTOs.Admin.ShortlistRequestDTO;
import com.example.backend.Exceptions.ResourceNotFoundException;
import com.example.backend.Models.DriveApplication;
import com.example.backend.Models.Offer;
import com.example.backend.Models.StudentSkill;
import com.example.backend.Models.User;
import com.example.backend.Models.enums.ApplicationStage;
import com.example.backend.Repositories.DriveApplicationRepository;
import com.example.backend.Repositories.OfferRepository;
import com.example.backend.Repositories.PlacementDriveRepository;
import com.example.backend.Repositories.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
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

    @Autowired
    private OfferRepository offerRepository;

    @Autowired
    private DriveEligibilitySyncService driveEligibilitySyncService;

    @Transactional(readOnly = true)
    public List<DriveApplicationDTO> getEligibleApplicants(Long driveId) {
        if (!placementDriveRepository.existsById(driveId)) {
            throw new ResourceNotFoundException("Placement Drive not found");
        }

        driveEligibilitySyncService.syncEligibleMappingsForDriveId(driveId);

        List<DriveApplication> applications = driveApplicationRepository.findByDriveId(driveId).stream()
                .filter(app -> Boolean.TRUE.equals(app.getFacultyApproved()))
                .filter(app -> Boolean.TRUE.equals(app.getSubmittedToAdmin()))
                .filter(app -> app.getStage() != ApplicationStage.REJECTED)
                .collect(Collectors.toList());
        return applications.stream().map(this::mapToDTO).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<DriveApprovalSummaryDTO> getDriveApprovalSummary() {
        var drives = placementDriveRepository.findAll();
        if (drives.isEmpty()) {
            return new ArrayList<>();
        }

        return drives.stream().map(drive -> DriveApprovalSummaryDTO.builder()
                .driveId(drive.getId())
                .driveTitle(drive.getTitle())
                .companyName(drive.getCompany() != null ? drive.getCompany().getName() : "N/A")
                .totalApprovedStudents(driveApplicationRepository
                        .countByDriveIdAndFacultyApprovedTrueAndSubmittedToAdminTrue(drive.getId()))
                .build())
                .collect(Collectors.toList());
    }

    public List<DriveApplicationDTO> getFacultyApprovedApplicants(Long driveId) {
        return getEligibleApplicants(driveId);
    }

    @Transactional
    public DriveApplicationDTO updateAdminStage(AdminStageUpdateRequestDTO request, String adminEmail) {
        if (request.getStage() != ApplicationStage.SELECTED) {
            throw new IllegalArgumentException("Placement Head can finalize only the SELECTED stage from this page.");
        }

        DriveApplication application = driveApplicationRepository
                .findByStudentProfileIdAndDriveId(request.getStudentId(), request.getDriveId())
                .orElseThrow(() -> new ResourceNotFoundException("Approved student mapping not found for this drive"));

        if (!Boolean.TRUE.equals(application.getFacultyApproved())) {
            throw new IllegalArgumentException("Only faculty-approved students can be finalized by Placement Head.");
        }

        User admin = userRepository.findByEmail(adminEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Placement Head account not found"));

        application.setStage(request.getStage());
        application.setSubmittedToAdmin(true);
        application.setLastUpdatedAt(LocalDateTime.now());
        application.setLastUpdatedBy(admin);

        return mapToDTO(driveApplicationRepository.save(application));
    }

    public List<DriveApplicationDTO> generateShortlist(Long driveId, ShortlistRequestDTO request, String adminEmail) {
        if (!placementDriveRepository.existsById(driveId)) {
            throw new ResourceNotFoundException("Placement Drive not found");
        }

        User admin = userRepository.findByEmail(adminEmail).orElse(null);

        List<DriveApplication> applications = driveApplicationRepository.findAllById(request.getApplicationIds());

        applications.forEach(app -> {
            if (app.getDrive().getId().equals(driveId)
                    && (app.getStage() == ApplicationStage.ELIGIBLE || app.getStage() == ApplicationStage.APPLIED)) {
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
        Offer offer = offerRepository.findByDriveId(app.getDrive().getId()).stream()
                .filter(currentOffer -> currentOffer.getStudentProfile().getId().equals(app.getStudentProfile().getId()))
                .findFirst()
                .orElse(null);

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

        String rollNo = app.getStudentProfile().getRollNo();
        if (rollNo == null || rollNo.isBlank()) {
            rollNo = app.getStudentProfile().getUser() != null
                    ? app.getStudentProfile().getUser().getUniversityRegNo()
                    : null;
        }

        return DriveApplicationDTO.builder()
                .id(app.getId())
                .studentId(app.getStudentProfile().getId())
                .studentName(studentName)
                .rollNo(rollNo)
                .departmentName(app.getStudentProfile().getUser().getDepartment() != null
                        ? app.getStudentProfile().getUser().getDepartment().getName()
                        : "N/A")
                .cgpa(app.getStudentProfile().getAcademicRecord() != null
                        ? app.getStudentProfile().getAcademicRecord().getCgpa()
                        : 0.0)
                .stage(app.getStage())
                .facultyApproved(Boolean.TRUE.equals(app.getFacultyApproved()))
                .submittedToAdmin(Boolean.TRUE.equals(app.getSubmittedToAdmin()))
                .companyName(app.getDrive().getCompany() != null ? app.getDrive().getCompany().getName() : null)
                .role(offer != null ? offer.getRole() : app.getDrive().getRole())
                .offerCtc(offer != null ? offer.getCtc() : null)
                .skills(app.getStudentProfile().getSkills() != null
                        ? app.getStudentProfile().getSkills().stream().map(StudentSkill::getSkillName).collect(Collectors.toList())
                        : List.of())
                .build();
    }
}
