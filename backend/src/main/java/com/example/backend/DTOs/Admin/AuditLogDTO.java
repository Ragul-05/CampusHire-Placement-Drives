package com.example.backend.DTOs.Admin;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Builder
public class AuditLogDTO {
    private Long id;
    private String adminEmail;
    private String action;
    private String targetEntity;
    private String targetEntityId;
    private String details;
    private LocalDateTime timestamp;
    private String ipAddress;
}
