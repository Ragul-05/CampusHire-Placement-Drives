package com.example.backend.Controllers;

import com.example.backend.DTOs.Faculty.ProfileVerificationRequestDTO;
import com.example.backend.Services.FacultyStudentService;
import com.example.backend.Utils.ApiResponse;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/faculty")
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
public class FacultyWorkflowController {

    @Autowired
    private FacultyStudentService facultyStudentService;

    private String resolveFacultyEmail(String facultyEmail, Authentication authentication) {
        if (authentication != null && authentication.getName() != null && !authentication.getName().isBlank()) {
            return authentication.getName();
        }
        if (facultyEmail != null && !facultyEmail.isBlank()) {
            return facultyEmail;
        }
        throw new IllegalArgumentException("Faculty email could not be resolved from the current session");
    }

    @PostMapping("/verify/{studentId}")
    public ResponseEntity<ApiResponse<Void>> verifyStudent(
            @PathVariable Long studentId,
            @Valid @RequestBody ProfileVerificationRequestDTO request,
            @RequestParam(required = false) String facultyEmail,
            Authentication authentication) {

        facultyStudentService.verifyStudentProfile(studentId, request, resolveFacultyEmail(facultyEmail, authentication));
        return ResponseEntity.ok(ApiResponse.success("Student verification updated successfully", null));
    }

    @PostMapping("/send-to-admin")
    public ResponseEntity<ApiResponse<Void>> sendToAdmin(
            @RequestBody FacultyStudentController.SendToAdminRequest request,
            @RequestParam(required = false) String facultyEmail,
            Authentication authentication) {

        facultyStudentService.sendStudentsToAdmin(
                request.getDriveId(),
                request.getStudentIds(),
                resolveFacultyEmail(facultyEmail, authentication));
        return ResponseEntity.ok(ApiResponse.success("Students sent to admin successfully", null));
    }
}
