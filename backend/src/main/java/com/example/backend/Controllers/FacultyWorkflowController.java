package com.example.backend.Controllers;

import com.example.backend.DTOs.Faculty.ProfileVerificationRequestDTO;
import com.example.backend.Services.FacultyStudentService;
import com.example.backend.Utils.ApiResponse;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/faculty")
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
public class FacultyWorkflowController {

    @Autowired
    private FacultyStudentService facultyStudentService;

    @PostMapping("/verify/{studentId}")
    public ResponseEntity<ApiResponse<Void>> verifyStudent(
            @PathVariable Long studentId,
            @Valid @RequestBody ProfileVerificationRequestDTO request,
            @RequestParam(required = false, defaultValue = "faculty@dept.com") String facultyEmail) {

        facultyStudentService.verifyStudentProfile(studentId, request, facultyEmail);
        return ResponseEntity.ok(ApiResponse.success("Student verification updated successfully", null));
    }

    @PostMapping("/send-to-admin")
    public ResponseEntity<ApiResponse<Void>> sendToAdmin(
            @RequestBody FacultyStudentController.SendToAdminRequest request,
            @RequestParam(required = false, defaultValue = "faculty@dept.com") String facultyEmail) {

        facultyStudentService.sendStudentsToAdmin(request.getDriveId(), request.getStudentIds(), facultyEmail);
        return ResponseEntity.ok(ApiResponse.success("Students sent to admin successfully", null));
    }
}
