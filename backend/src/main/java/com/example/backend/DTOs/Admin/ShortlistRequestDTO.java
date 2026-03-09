package com.example.backend.DTOs.Admin;

import jakarta.validation.constraints.NotEmpty;
import lombok.Data;
import java.util.List;

@Data
public class ShortlistRequestDTO {
    @NotEmpty(message = "Application IDs list cannot be empty")
    private List<Long> applicationIds;
}
