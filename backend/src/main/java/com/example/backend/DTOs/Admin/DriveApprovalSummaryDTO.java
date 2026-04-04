package com.example.backend.DTOs.Admin;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class DriveApprovalSummaryDTO {
    private Long driveId;
    private String driveTitle;
    private String companyName;
    private Long totalApprovedStudents;
}
