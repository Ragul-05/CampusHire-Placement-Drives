package com.example.backend.DTOs.Admin;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CompanyRequestDTO {
    @NotBlank(message = "Company Name is required")
    private String name;

    private String website;
    private String industry;
    private String visitHistory;
}
