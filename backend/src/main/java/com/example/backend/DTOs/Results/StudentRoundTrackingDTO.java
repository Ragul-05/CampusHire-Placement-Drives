package com.example.backend.DTOs.Results;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StudentRoundTrackingDTO {
    private Long studentId;
    private String studentName;
    private String companyName;
    private String currentStage;
    private int roundsCleared;
    private String placementStatus;
}
