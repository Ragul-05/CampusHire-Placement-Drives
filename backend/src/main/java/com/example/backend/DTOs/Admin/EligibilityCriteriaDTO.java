package com.example.backend.DTOs.Admin;

import lombok.Data;
import java.util.List;

@Data
public class EligibilityCriteriaDTO {
    private Double minCgpa;
    private Double minXMarks;
    private Double minXiiMarks;
    private Integer maxStandingArrears;
    private Integer maxHistoryOfArrears;
    private Integer graduationYear;
    private List<String> requiredSkills;
    private List<Long> allowedDepartmentIds;
}
