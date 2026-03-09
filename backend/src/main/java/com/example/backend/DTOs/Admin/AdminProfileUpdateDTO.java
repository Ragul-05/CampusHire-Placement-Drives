package com.example.backend.DTOs.Admin;

import jakarta.validation.constraints.Email;
import lombok.Data;

@Data
public class AdminProfileUpdateDTO {
    @Email(message = "Invalid email format")
    private String email;

    private String password;
}
