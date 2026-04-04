package com.example.backend.DTOs.Results;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CompanyRoundAnalysisDTO {
    private String companyName;
    private long round1AssessmentCleared;
    private long round2TechnicalCleared;
    private long round3HrCleared;
}
