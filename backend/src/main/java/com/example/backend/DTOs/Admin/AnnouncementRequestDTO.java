package com.example.backend.DTOs.Admin;

import com.example.backend.Models.enums.AnnouncementScope;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class AnnouncementRequestDTO {
    @NotBlank(message = "Title is required")
    private String title;

    @NotBlank(message = "Content is required")
    private String content;

    @NotNull(message = "Scope is required")
    private AnnouncementScope scope;

    private Long departmentId; // Required if scope is DEPARTMENT
}
