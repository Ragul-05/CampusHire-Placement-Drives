package com.example.backend.DTOs.Faculty;

import lombok.Builder;
import lombok.Data;
import java.util.List;

@Data
@Builder
public class FacultyDriveDTO {
    private Long id;
    private String companyName;
    private String title;
    private String role;
    private Double ctcLpa;
    private String status;
    private Long totalDepartmentApplicants;
    private Long selectedDepartmentApplicants;
}
