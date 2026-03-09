package com.example.backend.Controllers;

import com.example.backend.AOPs.AuditAction;
import com.example.backend.DTOs.Faculty.ProfileVerificationRequestDTO;
import com.example.backend.Services.FacultyStudentService;
import com.example.backend.Utils.ApiResponse;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/faculty/verifications")
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
public class FacultyVerificationController {

    @Autowired
    private FacultyStudentService facultyStudentService;

    @AuditAction(action = "SUBMIT_PROFILE_VERIFICATION", targetEntity = "PROFILE_VERIFICATION")
    @PostMapping("/submit")
    public ResponseEntity<ApiResponse<Void>> submitVerification(
            @Valid @RequestBody VerificationSubmission request,
            @RequestParam(required = false, defaultValue = "faculty@dept.com") String facultyEmail) {

        ProfileVerificationRequestDTO verificationRequest = new ProfileVerificationRequestDTO();
        verificationRequest.setStatus(com.example.backend.Models.enums.VerificationStatus.valueOf(request.getStatus()));
        verificationRequest.setRemarks(request.getRemarks());

        facultyStudentService.verifyStudentProfile(request.getStudentId(), verificationRequest, facultyEmail);
        return ResponseEntity.ok(ApiResponse.success("Verification submitted successfully", null));
    }

    // Inner DTO for verification submission
    @lombok.Data
    @lombok.Builder
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class VerificationSubmission {
        private Long studentId;
        private String status; // VERIFIED or REJECTED
        private String remarks;
    }
}
