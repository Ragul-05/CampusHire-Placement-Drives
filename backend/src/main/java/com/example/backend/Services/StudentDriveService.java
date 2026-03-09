package com.example.backend.Services;

import com.example.backend.DTOs.PlacementDriveDto;
import com.example.backend.Exceptions.ResourceNotFoundException;
import com.example.backend.Mappers.PlacementMapper;
import com.example.backend.Models.*;
import com.example.backend.Models.enums.DriveStatus;
import com.example.backend.Repositories.DriveApplicationRepository;
import com.example.backend.Repositories.PlacementDriveRepository;
import com.example.backend.Repositories.StudentProfileRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class StudentDriveService {

    @Autowired private PlacementDriveRepository placementDriveRepository;
    @Autowired private StudentProfileRepository  studentProfileRepository;
    @Autowired private DriveApplicationRepository driveApplicationRepository;

    @Transactional(readOnly = true)
    public List<PlacementDriveDto> getVisibleDrives(String email) {
        StudentProfile profile = studentProfileRepository.findByUserEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Profile not found"));

        List<PlacementDrive> drives = placementDriveRepository
                .findByStatusIn(List.of(DriveStatus.ONGOING, DriveStatus.UPCOMING));

        // Build a map of driveId → application for this student (one query)
        Map<Long, DriveApplication> appliedMap = driveApplicationRepository
                .findByStudentProfileId(profile.getId())
                .stream()
                .collect(Collectors.toMap(a -> a.getDrive().getId(), a -> a, (a, b) -> a));

        boolean isVerified = profile.getVerificationStatus() != null
                && profile.getVerificationStatus().name().equals("VERIFIED");

        return drives.stream().map(drive -> {
            boolean isEligible = true;
            String  ineligibilityReason = null;

            // If profile not verified — not eligible to apply
            if (!isVerified) {
                isEligible = false;
                ineligibilityReason = "Your profile must be verified before you can apply.";
            } else {
                EligibilityCriteria ec = drive.getEligibilityCriteria();
                AcademicRecord   ar = profile.getAcademicRecord();
                SchoolingDetails sd = profile.getSchoolingDetails();

                if (ec != null) {
                    if (ar == null) {
                        isEligible = false;
                        ineligibilityReason = "Academic record is incomplete.";
                    } else if (ec.getMinCgpa() != null && (ar.getCgpa() == null || ar.getCgpa() < ec.getMinCgpa())) {
                        isEligible = false;
                        ineligibilityReason = "CGPA " + ar.getCgpa() + " < required " + ec.getMinCgpa();
                    } else if (ec.getMaxStandingArrears() != null && ar.getStandingArrears() != null
                            && ar.getStandingArrears() > ec.getMaxStandingArrears()) {
                        isEligible = false;
                        ineligibilityReason = "Standing arrears " + ar.getStandingArrears() + " > allowed " + ec.getMaxStandingArrears();
                    } else if (ec.getMaxHistoryOfArrears() != null && ar.getHistoryOfArrears() != null
                            && ar.getHistoryOfArrears() > ec.getMaxHistoryOfArrears()) {
                        isEligible = false;
                        ineligibilityReason = "History of arrears " + ar.getHistoryOfArrears() + " > allowed " + ec.getMaxHistoryOfArrears();
                    } else if (sd != null && ec.getMinXMarks() != null
                            && (sd.getXMarksPercentage() == null || sd.getXMarksPercentage() < ec.getMinXMarks())) {
                        isEligible = false;
                        ineligibilityReason = "10th marks " + sd.getXMarksPercentage() + "% < required " + ec.getMinXMarks() + "%";
                    } else if (sd != null && ec.getMinXiiMarks() != null
                            && (sd.getXiiMarksPercentage() == null || sd.getXiiMarksPercentage() < ec.getMinXiiMarks())) {
                        isEligible = false;
                        ineligibilityReason = "12th marks " + sd.getXiiMarksPercentage() + "% < required " + ec.getMinXiiMarks() + "%";
                    }

                    // Department check
                    if (isEligible && ec.getAllowedDepartments() != null && !ec.getAllowedDepartments().isEmpty()) {
                        Long studentDeptId = profile.getUser() != null && profile.getUser().getDepartment() != null
                                ? profile.getUser().getDepartment().getId() : null;
                        boolean deptMatch = ec.getAllowedDepartments().stream()
                                .anyMatch(d -> d.getId().equals(studentDeptId));
                        if (!deptMatch) {
                            isEligible = false;
                            ineligibilityReason = "Your department is not eligible for this drive.";
                        }
                    }
                }
            }

            DriveApplication app = appliedMap.get(drive.getId());
            boolean hasApplied = app != null;
            String  appStage   = hasApplied && app.getStage() != null ? app.getStage().name() : null;

            return PlacementMapper.toDriveDto(drive, isEligible, ineligibilityReason, hasApplied, appStage);
        }).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public PlacementDriveDto getDriveDetails(String email, Long driveId) {
        return getVisibleDrives(email).stream()
                .filter(d -> d.getId().equals(driveId))
                .findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("Drive not found or not visible"));
    }
}
