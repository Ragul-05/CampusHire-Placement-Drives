package com.example.backend.Mappers;

import com.example.backend.DTOs.DriveApplicationDto;
import com.example.backend.DTOs.PlacementDriveDto;
import com.example.backend.Models.DriveApplication;
import com.example.backend.Models.EligibilityCriteria;
import com.example.backend.Models.PlacementDrive;

import java.util.Collections;
import java.util.stream.Collectors;

public class PlacementMapper {

    public static PlacementDriveDto toDriveDto(PlacementDrive drive, boolean isEligible,
            String ineligibilityReason, boolean hasApplied, String applicationStage) {
        if (drive == null) return null;

        PlacementDriveDto dto = PlacementDriveDto.builder()
                .id(drive.getId())
                .title(drive.getTitle())
                .role(drive.getRole())
                .ctcLpa(drive.getCtcLpa())
                .description(drive.getDescription())
                .status(drive.getStatus() != null ? drive.getStatus().name() : null)
                .createdAt(drive.getCreatedAt())
                .applicationDeadline(drive.getApplicationDeadline())
                .totalOpenings(drive.getTotalOpenings())
                .isEligible(isEligible)
                .ineligibilityReason(ineligibilityReason)
                .hasApplied(hasApplied)
                .applicationStage(applicationStage)
                .build();

        if (drive.getCompany() != null) {
            dto.setCompanyName(drive.getCompany().getName());
            dto.setCompanyIndustry(drive.getCompany().getIndustry());
            dto.setCompanyWebsite(drive.getCompany().getWebsite());
        }

        EligibilityCriteria ec = drive.getEligibilityCriteria();
        if (ec != null) {
            dto.setMinCgpa(ec.getMinCgpa());
            dto.setMaxStandingArrears(ec.getMaxStandingArrears());
            dto.setMaxHistoryOfArrears(ec.getMaxHistoryOfArrears());
            dto.setMinXMarks(ec.getMinXMarks());
            dto.setMinXiiMarks(ec.getMinXiiMarks());
            dto.setGraduationYear(ec.getGraduationYear());
            dto.setRequiredSkills(
                ec.getRequiredSkills() != null ? ec.getRequiredSkills() : Collections.emptyList());
            dto.setAllowedDepartments(
                ec.getAllowedDepartments() != null
                    ? ec.getAllowedDepartments().stream()
                        .map(d -> d.getName())
                        .collect(Collectors.toList())
                    : Collections.emptyList());
        }

        return dto;
    }

    /** Backward-compat overload — no application info */
    public static PlacementDriveDto toDriveDto(PlacementDrive drive, boolean isEligible, String ineligibilityReason) {
        return toDriveDto(drive, isEligible, ineligibilityReason, false, null);
    }

    public static DriveApplicationDto toAppDto(DriveApplication app) {
        if (app == null) return null;

        DriveApplicationDto dto = DriveApplicationDto.builder()
                .id(app.getId())
                .stage(app.getStage() != null ? app.getStage().name() : null)
                .driveStatus(app.getDrive() != null && app.getDrive().getStatus() != null
                        ? app.getDrive().getStatus().name()
                        : null)
                .appliedAt(app.getAppliedAt())
                .lastUpdatedAt(app.getLastUpdatedAt())
                .build();

        if (app.getDrive() != null) {
            dto.setDriveId(app.getDrive().getId());
            dto.setDriveTitle(app.getDrive().getTitle());
            dto.setRole(app.getDrive().getRole());
            dto.setCtcLpa(app.getDrive().getCtcLpa());
            dto.setApplicationDeadline(app.getDrive().getApplicationDeadline());
            if (app.getDrive().getCompany() != null) {
                dto.setCompanyName(app.getDrive().getCompany().getName());
                dto.setCompanyIndustry(app.getDrive().getCompany().getIndustry());
            }
        }

        return dto;
    }
}
