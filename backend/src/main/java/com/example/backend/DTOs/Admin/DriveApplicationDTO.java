package com.example.backend.DTOs.Admin;

import com.example.backend.Models.enums.ApplicationStage;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class DriveApplicationDTO {
    private Long id;
    private Long studentId;
    private String studentName;
    private String rollNo;
    private String departmentName;
    private Double cgpa;
    private ApplicationStage stage;
}
