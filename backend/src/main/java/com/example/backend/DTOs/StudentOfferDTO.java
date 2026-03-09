package com.example.backend.DTOs;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Builder
public class StudentOfferDTO {
    private Long id;
    private Long driveId;
    private String driveTitle;
    private String companyName;
    private String companyIndustry;
    private String role;
    private Double ctcLpa;
    private LocalDateTime issuedAt;
    private String status; // "OFFERED"
    // student placement summary
    private Boolean isPlaced;
    private Boolean isLocked;
    private Integer numberOfOffers;
    private Double highestPackageLpa;
}
