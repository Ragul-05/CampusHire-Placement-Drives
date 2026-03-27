package com.example.backend.DTOs.Faculty;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FacultyDriveDTO {
    private Long id;
    private String companyName;
    private String title;
    private String role;
    private Double ctcLpa;
    private String status;
    private Long totalDepartmentApplicants;
    private Long selectedDepartmentApplicants;
    private EligibilityCriteriaDTO eligibilityCriteria;
}
