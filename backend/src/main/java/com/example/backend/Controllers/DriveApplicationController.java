package com.example.backend.Controllers;

import com.example.backend.DTOs.DriveApplicationDto;
import com.example.backend.Services.DriveApplicationService;
import com.example.backend.Utils.ApiResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/student/applications")
public class DriveApplicationController {

    @Autowired
    private DriveApplicationService driveApplicationService;

    private String resolveStudentEmail(String email, Authentication authentication) {
        if (authentication != null && authentication.getName() != null && !authentication.getName().isBlank()) {
            return authentication.getName();
        }
        if (email != null && !email.isBlank()) {
            return email;
        }
        throw new IllegalArgumentException("Student email could not be resolved from the current session");
    }

    @PostMapping("/{driveId}/apply")
    public ResponseEntity<ApiResponse<Void>> applyForDrive(
            @RequestParam(required = false) String email,
            Authentication authentication,
            @PathVariable Long driveId) {
        driveApplicationService.applyForDrive(resolveStudentEmail(email, authentication), driveId);
        return ResponseEntity.ok(ApiResponse.success("Successfully applied for the drive", null));
    }

    @PostMapping("/apply/{driveId}")
    public ResponseEntity<ApiResponse<Void>> applyForDriveLegacy(
            @RequestParam(required = false) String email,
            Authentication authentication,
            @PathVariable Long driveId) {
        driveApplicationService.applyForDrive(resolveStudentEmail(email, authentication), driveId);
        return ResponseEntity.ok(ApiResponse.success("Successfully applied for the drive", null));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<DriveApplicationDto>>> getMyApplications(
            @RequestParam(required = false) String email,
            Authentication authentication) {
        return ResponseEntity
                .ok(ApiResponse.success("Applications fetched",
                        driveApplicationService.getMyApplications(resolveStudentEmail(email, authentication))));
    }
}
