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
public class EligibilityCriteriaDTO {
    private Double minCgpa;
    private Integer maxStandingArrears;
    private Integer maxHistoryOfArrears;
    private List<String> allowedDepartments;
    private List<Integer> allowedGraduationYears;
    private List<String> requiredSkills;
}
