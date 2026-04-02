package com.example.backend.Controllers;

import com.example.backend.DTOs.PlacementDriveDto;
import com.example.backend.Services.StudentDriveService;
import com.example.backend.Utils.ApiResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/student/drives")
public class StudentDriveController {

    @Autowired
    private StudentDriveService studentDriveService;

    private String resolveStudentEmail(String email, Authentication authentication) {
        if (authentication != null && authentication.getName() != null && !authentication.getName().isBlank()) {
            return authentication.getName();
        }
        if (email != null && !email.isBlank()) {
            return email;
        }
        throw new IllegalArgumentException("Student email could not be resolved from the current session");
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<PlacementDriveDto>>> getVisibleDrives(
            @RequestParam(required = false) String email,
            Authentication authentication) {
        return ResponseEntity
                .ok(ApiResponse.success("Visible drives fetched",
                        studentDriveService.getVisibleDrives(resolveStudentEmail(email, authentication))));
    }

    @GetMapping("/eligible")
    public ResponseEntity<ApiResponse<List<PlacementDriveDto>>> getEligibleDrives(
            @RequestParam(required = false) String email,
            Authentication authentication) {
        return ResponseEntity
                .ok(ApiResponse.success("Eligible drives fetched",
                        studentDriveService.getEligibleDrives(resolveStudentEmail(email, authentication))));
    }

    @GetMapping("/eligible-drives")
    public ResponseEntity<ApiResponse<List<PlacementDriveDto>>> getEligibleDrivesAlias(
            @RequestParam(required = false) String email,
            Authentication authentication) {
        return ResponseEntity
                .ok(ApiResponse.success("Eligible drives fetched",
                        studentDriveService.getEligibleDrives(resolveStudentEmail(email, authentication))));
    }

    @GetMapping("/{driveId}")
    public ResponseEntity<ApiResponse<PlacementDriveDto>> getDriveDetails(
            @RequestParam(required = false) String email,
            Authentication authentication,
            @PathVariable Long driveId) {
        return ResponseEntity
                .ok(ApiResponse.success("Drive details fetched",
                        studentDriveService.getDriveDetails(resolveStudentEmail(email, authentication), driveId)));
    }
}
