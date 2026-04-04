package com.example.backend.DTOs.Results;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PlacementResultsSummaryDTO {
    private long totalStudents;
    private long placedStudents;
    private long unplacedStudents;
    private double placementPercentage;
}
