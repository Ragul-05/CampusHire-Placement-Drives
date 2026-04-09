package com.example.backend.DTOs.Admin;

import lombok.Builder;
import lombok.Data;
import java.util.Map;

@Data
@Builder
public class AnalyticsResponseDTO {
    private Double placementRate;
    private Long totalPlaced;
    private Long totalVerified;
    private Long totalOffers;
    private Map<String, Long> topRecruiters;
    private Map<String, Long> branchWisePlacements;
    private Map<String, Long> branchWiseOffers;
    private Map<String, Long> monthlyOfferTrend;
}
