package com.example.backend.DTOs.Faculty;

import com.example.backend.Models.enums.VerificationStatus;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProfileVerificationRequestDTO {
    @NotNull(message = "Status cannot be null")
    private VerificationStatus status; // VERIFIED, REJECTED

    private String remarks; // Mandatory if REJECTED
}
