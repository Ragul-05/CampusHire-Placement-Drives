package com.example.backend.DTOs.Faculty;

import com.example.backend.Models.enums.ApplicationStage;
import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class FacultyApplicationDTO {
    private Long id;
    private Long studentId;
    private String studentName;
    private String rollNo;
    private Long driveId;
    private String companyName;
    private String driveRole;
    private ApplicationStage stage;
    private LocalDateTime appliedAt;
    private LocalDateTime lastUpdatedAt;
    private Double cgpa;
    private List<String> skills;
    private String verificationStatus;
    private Boolean isEligibleForPlacements;
    private Boolean facultyApproved;
}
