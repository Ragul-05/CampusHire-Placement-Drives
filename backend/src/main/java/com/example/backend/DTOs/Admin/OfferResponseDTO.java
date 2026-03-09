package com.example.backend.DTOs.Admin;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Builder
public class OfferResponseDTO {
    private Long id;
    private Long studentId;
    private String studentEmail;
    private Long driveId;
    private Double ctc;
    private String role;
    private LocalDateTime issuedAt;
}
