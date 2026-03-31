package com.example.backend.Controllers;

import com.example.backend.AOPs.AuditAction;
import com.example.backend.DTOs.Faculty.FacultyStudentDTO;
import com.example.backend.DTOs.Faculty.ProfileVerificationRequestDTO;
import com.example.backend.Models.ProfileVerification;
import com.example.backend.Services.FacultyStudentService;
import com.example.backend.Utils.ApiResponse;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/faculty/students")
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
public class FacultyStudentController {

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

    @AuditAction(action = "VIEW_DEPARTMENT_STUDENTS", targetEntity = "STUDENT_PROFILE")
    @GetMapping
    public ResponseEntity<ApiResponse<List<FacultyStudentDTO>>> getDepartmentStudents(
            @RequestParam(required = false) String facultyEmail,
            Authentication authentication,
            @RequestParam(required = false) String status) {

        List<FacultyStudentDTO> students = facultyStudentService.getDepartmentStudents(
                resolveFacultyEmail(facultyEmail, authentication),
                status);
        return ResponseEntity.ok(ApiResponse.success("Department students retrieved successfully", students));
    }

    @AuditAction(action = "VIEW_PENDING_STUDENTS", targetEntity = "STUDENT_PROFILE")
    @GetMapping("/pending")
    public ResponseEntity<ApiResponse<List<FacultyStudentDTO>>> getPendingStudents(
            @RequestParam(required = false) String facultyEmail,
            Authentication authentication) {

        List<FacultyStudentDTO> students = facultyStudentService.getPendingStudents(
                resolveFacultyEmail(facultyEmail, authentication));
        return ResponseEntity.ok(ApiResponse.success("Pending students retrieved successfully", students));
    }

    @AuditAction(action = "VIEW_STUDENT_PROFILE", targetEntity = "STUDENT_PROFILE")
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<FacultyStudentDTO>> getStudentProfile(
            @PathVariable Long id,
            @RequestParam(required = false) String facultyEmail,
            Authentication authentication) {

        FacultyStudentDTO student = facultyStudentService.getStudentProfile(
                id,
                resolveFacultyEmail(facultyEmail, authentication));
        return ResponseEntity.ok(ApiResponse.success("Student profile retrieved successfully", student));
    }

    @AuditAction(action = "VERIFY_STUDENT_PROFILE", targetEntity = "PROFILE_VERIFICATION")
    @PostMapping("/{id}/verify")
    public ResponseEntity<ApiResponse<Void>> verifyStudentProfile(
            @PathVariable Long id,
            @Valid @RequestBody ProfileVerificationRequestDTO request,
            @RequestParam(required = false) String facultyEmail,
            Authentication authentication) {

        facultyStudentService.verifyStudentProfile(id, request, resolveFacultyEmail(facultyEmail, authentication));
        return ResponseEntity.ok(ApiResponse.success("Student profile verification updated successfully", null));
    }

    @AuditAction(action = "SEND_STUDENT_TO_ADMIN", targetEntity = "STUDENT_PROFILE")
    @PostMapping("/{id}/send-to-admin")
    public ResponseEntity<ApiResponse<Void>> sendToAdmin(
            @PathVariable Long id,
            @RequestParam(required = false) String facultyEmail,
            Authentication authentication) {

        facultyStudentService.sendStudentToAdmin(id, resolveFacultyEmail(facultyEmail, authentication));
        return ResponseEntity.ok(ApiResponse.success("Student flagged for admin review", null));
    }

    @AuditAction(action = "SEND_STUDENTS_TO_ADMIN", targetEntity = "DRIVE_APPLICATION")
    @PostMapping("/send-to-admin")
    public ResponseEntity<ApiResponse<Void>> sendStudentsToAdmin(
            @RequestBody SendToAdminRequest request,
            @RequestParam(required = false) String facultyEmail,
            Authentication authentication) {

        facultyStudentService.sendStudentsToAdmin(
                request.getDriveId(),
                request.getStudentIds(),
                resolveFacultyEmail(facultyEmail, authentication));
        return ResponseEntity.ok(ApiResponse.success("Students sent to admin successfully", null));
    }

    @AuditAction(action = "VIEW_VERIFICATION_HISTORY", targetEntity = "PROFILE_VERIFICATION")
    @GetMapping("/verification-history")
    public ResponseEntity<ApiResponse<List<ProfileVerification>>> getVerificationHistory(
            @RequestParam(required = false) String facultyEmail,
            Authentication authentication) {

        List<ProfileVerification> history = facultyStudentService.getVerificationHistory(
                resolveFacultyEmail(facultyEmail, authentication));
        return ResponseEntity.ok(ApiResponse.success("Verification history retrieved successfully", history));
    }

    @AuditAction(action = "VIEW_ALL_STUDENTS", targetEntity = "STUDENT_PROFILE")
    @GetMapping("/all")
    public ResponseEntity<ApiResponse<List<FacultyStudentDTO>>> getAllStudents(
            @RequestParam(required = false) String facultyEmail,
            Authentication authentication) {

        List<FacultyStudentDTO> students = facultyStudentService.getDepartmentStudents(
                resolveFacultyEmail(facultyEmail, authentication),
                null);
        return ResponseEntity.ok(ApiResponse.success("All students retrieved successfully", students));
    }

    @lombok.Data
    public static class SendToAdminRequest {
        private Long driveId;
        private List<Long> studentIds;
    }
}
