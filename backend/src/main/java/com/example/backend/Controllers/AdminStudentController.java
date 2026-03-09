package com.example.backend.Controllers;

import com.example.backend.AOPs.AuditAction;
import com.example.backend.DTOs.Admin.AdminStudentProfileDTO;
import com.example.backend.Services.AdminStudentService;
import com.example.backend.Utils.ApiResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/students")
public class AdminStudentController {

    @Autowired
    private AdminStudentService adminStudentService;

    @GetMapping("/search")
    public ResponseEntity<ApiResponse<List<AdminStudentProfileDTO>>> searchVerifiedStudents(
            @RequestParam(required = false) String query) {
        List<AdminStudentProfileDTO> response = adminStudentService.searchVerifiedStudents(query);
        return ResponseEntity.ok(ApiResponse.success("Verified students fetched successfully", response));
    }

    @GetMapping("/{studentId}")
    public ResponseEntity<ApiResponse<AdminStudentProfileDTO>> getStudentById(@PathVariable Long studentId) {
        AdminStudentProfileDTO response = adminStudentService.getStudentById(studentId);
        return ResponseEntity.ok(ApiResponse.success("Student fetched successfully", response));
    }

    @PatchMapping("/{studentId}/toggle-lock")
    @AuditAction(action = "TOGGLE_PROFILE_LOCK", targetEntity = "StudentProfile")
    public ResponseEntity<ApiResponse<AdminStudentProfileDTO>> toggleProfileLock(
            @RequestParam(required = false) String email,
            @PathVariable Long studentId) {
        AdminStudentProfileDTO response = adminStudentService.toggleProfileLock(studentId);
        String message = response.getIsLocked() ? "Profile locked successfully" : "Profile unlocked successfully";
        return ResponseEntity.ok(ApiResponse.success(message, response));
    }
}
