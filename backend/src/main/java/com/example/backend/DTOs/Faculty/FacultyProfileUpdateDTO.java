package com.example.backend.DTOs.Faculty;

import jakarta.validation.constraints.Email;
import lombok.Data;

@Data
public class FacultyProfileUpdateDTO {
    @Email(message = "Invalid email format")
    private String email;

    private String password;
}
