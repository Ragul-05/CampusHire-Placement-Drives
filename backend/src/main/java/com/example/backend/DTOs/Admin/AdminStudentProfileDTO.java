package com.example.backend.DTOs.Admin;

import com.example.backend.Models.enums.VerificationStatus;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AdminStudentProfileDTO {
    private Long id;
    private String email;
    private String rollNo;
    private String batch;
    private String departmentName;
    private VerificationStatus verificationStatus;
    private Boolean isLocked;
    private Boolean isPlaced;
    private Double highestPackageLpa;
    private String resumeUrl;
}
