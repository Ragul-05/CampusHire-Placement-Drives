package com.example.backend.DTOs.Admin;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Builder
public class OfferResponseDTO {
    private Long id;
    private Long studentId;
    private String studentName;
    private String studentEmail;
    private Long driveId;
    private String driveTitle;
    private String companyName;
    private Double ctc;
    private String role;
    private LocalDateTime issuedAt;
}
