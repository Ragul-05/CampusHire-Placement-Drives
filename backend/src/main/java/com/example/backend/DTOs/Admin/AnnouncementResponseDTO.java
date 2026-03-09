package com.example.backend.DTOs.Admin;

import com.example.backend.Models.enums.AnnouncementScope;
import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Builder
public class AnnouncementResponseDTO {
    private Long id;
    private String title;
    private String content;
    private AnnouncementScope scope;
    private String departmentName;
    private String createdByEmail;
    private LocalDateTime createdAt;
}
