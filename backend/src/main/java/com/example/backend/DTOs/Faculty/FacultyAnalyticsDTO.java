package com.example.backend.DTOs.Faculty;

import lombok.Builder;
import lombok.Data;
import java.util.Map;

@Data
@Builder
public class FacultyAnalyticsDTO {
    private Double averagePackageLpa;
    private Double highestPackageLpa;
    private Long totalPlaced;
    private Long totalOffers;
    private Long totalEligible;
    private Double placementPercentage;
    private Map<String, Long> topRecruiters; // Company Name -> Students placed
    private Map<String, Long> monthlyOfferTrend;
}
