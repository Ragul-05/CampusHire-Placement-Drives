package com.example.backend.DTOs.Admin;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Builder
public class CompanyResponseDTO {
    private Long id;
    private String name;
    private String website;
    private String industry;
    private String visitHistory;
    private Long hiringCount;
    private LocalDateTime createdAt;
}
