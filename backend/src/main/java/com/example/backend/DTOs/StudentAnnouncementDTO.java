package com.example.backend.DTOs;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Builder
public class StudentAnnouncementDTO {
    private Long id;
    private String title;
    private String content;
    private String scope;           // "GLOBAL" | "DEPARTMENT"
    private String departmentName;
    private String createdByEmail;
    private String postedByRole;    // "PLACEMENT_HEAD" | "FACULTY" | "SYSTEM"
    private String postedByName;    // display label e.g. "Placement Head" | "Faculty – CSE"
    private LocalDateTime createdAt;
}


