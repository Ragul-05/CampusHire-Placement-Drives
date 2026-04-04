package com.example.backend.DTOs.Results;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PlacementStatusRowDTO {
    private Long studentId;
    private String studentName;
    private String department;
    private String placementStatus;
    private String companyName;
    private Double ctc;
}
