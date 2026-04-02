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
import com.example.backend.Models.Offer;
import com.example.backend.Models.User;
import com.example.backend.Models.StudentSkill;
import com.example.backend.Models.enums.ApplicationStage;
import com.example.backend.Models.enums.DriveStatus;
import com.example.backend.Repositories.DriveApplicationRepository;
import com.example.backend.Repositories.OfferRepository;
import com.example.backend.Repositories.PlacementDriveRepository;
import com.example.backend.Repositories.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class FacultyDriveService {

    @Autowired
    private PlacementDriveRepository placementDriveRepository;

    @Autowired
    private DriveApplicationRepository driveApplicationRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private OfferRepository offerRepository;

    @Autowired
    private DriveEligibilitySyncService driveEligibilitySyncService;

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

        List<PlacementDrive> drives = placementDriveRepository.findAll().stream()
                .filter(drive -> statuses == null || statuses.isEmpty() || statuses.contains(drive.getStatus()))
                .filter(drive -> isDriveVisibleToDepartment(drive, departmentId))
                .collect(Collectors.toList());

        return drives.stream().map(drive -> {
            driveEligibilitySyncService.syncEligibleMappingsForDrive(drive);
            List<DriveApplication> applications = driveApplicationRepository.findByDriveId(drive.getId());
            long totalApplicants = applications.size();
            long selectedApplicants = applications.stream()
                    .filter(app -> app.getStage() == ApplicationStage.SELECTED)
                    .count();
            Map<String, Long> stageCounts = new LinkedHashMap<>();
            for (ApplicationStage stage : List.of(
                    ApplicationStage.ELIGIBLE,
                    ApplicationStage.APPLIED,
                    ApplicationStage.ASSESSMENT,
                    ApplicationStage.TECHNICAL,
                    ApplicationStage.HR,
                    ApplicationStage.SELECTED
            )) {
                stageCounts.put(stage.name(), applications.stream().filter(app -> app.getStage() == stage).count());
            }

            return FacultyDriveDTO.builder()
                    .id(drive.getId())
                    .companyName(drive.getCompany().getName())
                    .title(drive.getTitle())
                    .role(drive.getRole())
                    .ctcLpa(drive.getCtcLpa())
                    .status(drive.getStatus().name())
                    .applicationDeadline(drive.getApplicationDeadline())
                    .totalDepartmentApplicants(totalApplicants)
                    .selectedDepartmentApplicants(selectedApplicants)
                    .stageCounts(stageCounts)
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
        getAuthenticatedFaculty(facultyEmail);

        // Ensure drive exists
        if (!placementDriveRepository.existsById(driveId)) {
            throw new ResourceNotFoundException("Placement Drive not found");
        }

        driveEligibilitySyncService.syncEligibleMappingsForDriveId(driveId);
        List<DriveApplication> applications = driveApplicationRepository.findByDriveId(driveId);
        Map<Long, Offer> offersByStudent = offerRepository.findByDriveId(driveId).stream()
                .collect(Collectors.toMap(offer -> offer.getStudentProfile().getId(), offer -> offer, (first, second) -> first));

        return applications.stream().map(app -> FacultyApplicationDTO.builder()
                .id(app.getId())
                .studentId(app.getStudentProfile().getId())
                .studentName(app.getStudentProfile().getPersonalDetails() != null
                        && app.getStudentProfile().getPersonalDetails().getFirstName() != null
                        && !app.getStudentProfile().getPersonalDetails().getFirstName().isBlank()
                        ? (app.getStudentProfile().getPersonalDetails().getFirstName() + " "
                                + (app.getStudentProfile().getPersonalDetails().getLastName() != null
                                        ? app.getStudentProfile().getPersonalDetails().getLastName()
                                        : "")).trim()
                        : app.getStudentProfile().getUser().getEmail())
                .rollNo(app.getStudentProfile().getRollNo())
                .driveId(app.getDrive().getId())
                .companyName(app.getDrive().getCompany().getName())
                .driveRole(app.getDrive().getRole())
                .stage(app.getStage())
                .appliedAt(app.getAppliedAt())
                .lastUpdatedAt(app.getLastUpdatedAt())
                .driveStatus(app.getDrive().getStatus() != null ? app.getDrive().getStatus().name() : null)
                .cgpa(app.getStudentProfile().getAcademicRecord() != null
                        ? app.getStudentProfile().getAcademicRecord().getCgpa()
                        : null)
                .skills(app.getStudentProfile().getSkills() != null
                        ? app.getStudentProfile().getSkills().stream().map(StudentSkill::getSkillName).collect(Collectors.toList())
                        : List.of())
                .verificationStatus(app.getStudentProfile().getVerificationStatus() != null
                        ? app.getStudentProfile().getVerificationStatus().name()
                        : null)
                .isEligibleForPlacements(Boolean.TRUE.equals(app.getStudentProfile().getIsEligibleForPlacements()))
                .facultyApproved(Boolean.TRUE.equals(app.getFacultyApproved()))
                .submittedToAdmin(Boolean.TRUE.equals(app.getSubmittedToAdmin()))
                .offerCompany(offersByStudent.containsKey(app.getStudentProfile().getId())
                        ? offersByStudent.get(app.getStudentProfile().getId()).getDrive().getCompany().getName()
                        : null)
                .offerRole(offersByStudent.containsKey(app.getStudentProfile().getId())
                        ? offersByStudent.get(app.getStudentProfile().getId()).getRole()
                        : null)
                .offerCtc(offersByStudent.containsKey(app.getStudentProfile().getId())
                        ? offersByStudent.get(app.getStudentProfile().getId()).getCtc()
                        : null)
                .build()).collect(Collectors.toList());
    }

    public long submitDriveToAdmin(Long driveId, String facultyEmail) {
        User faculty = getAuthenticatedFaculty(facultyEmail);

        List<DriveApplication> applications = driveApplicationRepository
                .findByDriveId(driveId)
                .stream()
                .filter(app -> Boolean.TRUE.equals(app.getFacultyApproved()))
                .collect(Collectors.toList());

        applications.forEach(app -> {
            app.setSubmittedToAdmin(true);
            app.setLastUpdatedBy(faculty);
        });
        driveApplicationRepository.saveAll(applications);
        return applications.size();
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
