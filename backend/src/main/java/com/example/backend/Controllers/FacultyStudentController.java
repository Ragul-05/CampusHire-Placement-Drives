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
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/faculty/students")
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
public class FacultyStudentController {

    @Autowired
    private FacultyStudentService facultyStudentService;

    @AuditAction(action = "VIEW_DEPARTMENT_STUDENTS", targetEntity = "STUDENT_PROFILE")
    @GetMapping
    public ResponseEntity<ApiResponse<List<FacultyStudentDTO>>> getDepartmentStudents(
            @RequestParam(required = false, defaultValue = "faculty@dept.com") String facultyEmail,
            @RequestParam(required = false) String status) {

        List<FacultyStudentDTO> students = facultyStudentService.getDepartmentStudents(facultyEmail, status);
        return ResponseEntity.ok(ApiResponse.success("Department students retrieved successfully", students));
    }

    @AuditAction(action = "VIEW_STUDENT_PROFILE", targetEntity = "STUDENT_PROFILE")
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<FacultyStudentDTO>> getStudentProfile(
            @PathVariable Long id,
            @RequestParam(required = false, defaultValue = "faculty@dept.com") String facultyEmail) {

        FacultyStudentDTO student = facultyStudentService.getStudentProfile(id, facultyEmail);
        return ResponseEntity.ok(ApiResponse.success("Student profile retrieved successfully", student));
    }

    @AuditAction(action = "VERIFY_STUDENT_PROFILE", targetEntity = "PROFILE_VERIFICATION")
    @PostMapping("/{id}/verify")
    public ResponseEntity<ApiResponse<Void>> verifyStudentProfile(
            @PathVariable Long id,
            @Valid @RequestBody ProfileVerificationRequestDTO request,
            @RequestParam(required = false, defaultValue = "faculty@dept.com") String facultyEmail) {

        facultyStudentService.verifyStudentProfile(id, request, facultyEmail);
        return ResponseEntity.ok(ApiResponse.success("Student profile verification updated successfully", null));
    }

    @AuditAction(action = "VIEW_VERIFICATION_HISTORY", targetEntity = "PROFILE_VERIFICATION")
    @GetMapping("/verification-history")
    public ResponseEntity<ApiResponse<List<ProfileVerification>>> getVerificationHistory(
            @RequestParam(required = false, defaultValue = "faculty@dept.com") String facultyEmail) {

        List<ProfileVerification> history = facultyStudentService.getVerificationHistory(facultyEmail);
        return ResponseEntity.ok(ApiResponse.success("Verification history retrieved successfully", history));
    }

    @AuditAction(action = "VIEW_ALL_STUDENTS", targetEntity = "STUDENT_PROFILE")
    @GetMapping("/all")
    public ResponseEntity<ApiResponse<List<FacultyStudentDTO>>> getAllStudents(
            @RequestParam(required = false, defaultValue = "faculty@dept.com") String facultyEmail) {

        List<FacultyStudentDTO> students = facultyStudentService.getDepartmentStudents(facultyEmail, null);
        return ResponseEntity.ok(ApiResponse.success("All students retrieved successfully", students));
    }
}
