package com.example.backend.Controllers;

import com.example.backend.DTOs.AuthRequestDto;
import com.example.backend.DTOs.AuthResponseDto;
import com.example.backend.DTOs.RefreshTokenRequestDto;
import com.example.backend.Services.StudentAuthService;
import com.example.backend.Utils.ApiResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/student/auth")
public class StudentAuthController {

    @Autowired
    private StudentAuthService studentAuthService;

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponseDto>> login(@RequestBody AuthRequestDto request) {
        AuthResponseDto response = studentAuthService.login(request);
        return ResponseEntity.ok(ApiResponse.success("Login successful", response));
    }

    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse<AuthResponseDto>> refresh(@RequestBody RefreshTokenRequestDto request) {
        AuthResponseDto response = studentAuthService.refresh(request);
        return ResponseEntity.ok(ApiResponse.success("Token refreshed successfully", response));
    }

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<Void>> register(@RequestBody AuthRequestDto request,
                                                      @RequestParam String universityRegNo,
                                                      @RequestParam(required = false) String departmentCode,
                                                      @RequestParam(required = false) String role) {
        studentAuthService.register(request, universityRegNo, departmentCode != null ? departmentCode : role);
        return ResponseEntity.ok(ApiResponse.success("Student registered successfully", null));
    }
}
