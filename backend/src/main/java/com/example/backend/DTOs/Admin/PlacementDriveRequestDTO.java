package com.example.backend.DTOs.Admin;

import com.example.backend.Models.enums.DriveStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class PlacementDriveRequestDTO {
    @NotNull(message = "Company ID is required")
    private Long companyId;

    @NotBlank(message = "Title is required")
    private String title;

    @NotBlank(message = "Role is required")
    private String role;

    @NotNull(message = "CTC is required")
    private Double ctcLpa;

    private String description;

    // Optional, defaults to UPCOMING if null
    private DriveStatus status;

    private LocalDateTime applicationDeadline;

    private Integer totalOpenings;

    private EligibilityCriteriaDTO eligibilityCriteria;
}
