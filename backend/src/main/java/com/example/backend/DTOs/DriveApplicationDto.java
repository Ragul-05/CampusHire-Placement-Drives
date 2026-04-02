package com.example.backend.DTOs;

import lombok.Data;
import lombok.Builder;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DriveApplicationDto {
    private Long id;
    private Long driveId;
    private String driveTitle;
    private String role;
    private String companyName;
    private String companyIndustry;
    private Double ctcLpa;
    private String stage; // ELIGIBLE, ASSESSMENT, TECHNICAL, HR, SELECTED, REJECTED
    private String driveStatus;
    private LocalDateTime appliedAt;
    private LocalDateTime lastUpdatedAt;
    private LocalDateTime applicationDeadline;
}
