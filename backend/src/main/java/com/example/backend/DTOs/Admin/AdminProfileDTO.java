package com.example.backend.DTOs.Admin;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Builder
public class AdminProfileDTO {
    private Long id;
    private String email;
    private String role;
    private String universityRegNo;
    private Long departmentId;
    private String departmentName;
    private Boolean isActive;
    private LocalDateTime createdAt;
}
