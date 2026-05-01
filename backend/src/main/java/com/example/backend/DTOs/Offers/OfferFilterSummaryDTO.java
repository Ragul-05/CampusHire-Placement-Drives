package com.example.backend.DTOs.Offers;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class OfferFilterSummaryDTO {
    private long totalStudentsWithOffers;
    private long singleOfferStudents;
    private long multipleOfferStudents;
}
