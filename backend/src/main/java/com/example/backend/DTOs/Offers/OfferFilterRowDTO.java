package com.example.backend.DTOs.Offers;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class OfferFilterRowDTO {
    private Long studentId;
    private String studentName;
    private String departmentName;
    private Long departmentId;
    private Long offerCount;
    private String companyNames;
    private String packages;
}
