package com.example.backend.DTOs.Results;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PlacementResultsResponseDTO {
    private PlacementResultsSummaryDTO summary;
    private List<PlacementStatusRowDTO> placedVsUnplaced;
    private List<CompanyRoundAnalysisDTO> companyRoundAnalysis;
    private List<StudentRoundTrackingDTO> studentRoundTracking;
}
