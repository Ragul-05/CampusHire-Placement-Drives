package com.example.backend.DTOs.Admin;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;

@Data
public class OfferRequestDTO {
    @NotNull(message = "Student ID is required")
    private Long studentId;

    @NotNull(message = "CTC is required")
    @Positive(message = "CTC must be positive")
    private Double ctc;

    @NotBlank(message = "Role is required")
    private String role;
}
