package com.example.backend.DTOs.Faculty;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

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
    private LocalDateTime applicationDeadline;
    private Long totalDepartmentApplicants;
    private Long selectedDepartmentApplicants;
    private Map<String, Long> stageCounts;
    private EligibilityCriteriaDTO eligibilityCriteria;
}
