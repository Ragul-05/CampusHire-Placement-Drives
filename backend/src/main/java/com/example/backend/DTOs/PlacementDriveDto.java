package com.example.backend.DTOs;

import lombok.Data;
import lombok.Builder;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PlacementDriveDto {
    private Long          id;
    private String        title;
    private String        role;
    private Double        ctcLpa;
    private String        status;           // UPCOMING / ONGOING / COMPLETED
    private String        description;
    private LocalDateTime createdAt;
    private LocalDateTime applicationDeadline;
    private Integer       totalOpenings;

    // Company
    private String companyName;
    private String companyIndustry;
    private String companyWebsite;
    private String companyLogoUrl;

    // Eligibility
    private Boolean isEligible;
    private String  ineligibilityReason;

    // Eligibility criteria details (shown on card)
    private Double       minCgpa;
    private Integer      maxStandingArrears;
    private Integer      maxHistoryOfArrears;
    private Double       minXMarks;
    private Double       minXiiMarks;
    private Integer      graduationYear;
    private List<String> requiredSkills;
    private List<String> allowedDepartments;

    // Application status for this student
    private Boolean hasApplied;
    private String  applicationStage;   // APPLIED / ASSESSMENT / TECHNICAL / HR / SELECTED
}
