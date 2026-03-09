package com.example.backend.DTOs.Admin;

import com.example.backend.Models.enums.ApplicationStage;
import lombok.Builder;
import lombok.Data;

import java.util.Map;

@Data
@Builder
public class ParticipationStatsDTO {
    private Long driveId;
    private Long totalApplicants;
    private Map<ApplicationStage, Long> stageBreakdown;
    private Map<String, Long> departmentBreakdown;
}
