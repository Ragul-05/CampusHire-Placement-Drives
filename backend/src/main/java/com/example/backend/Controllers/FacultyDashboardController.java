package com.example.backend.Controllers;

import com.example.backend.AOPs.AuditAction;
import com.example.backend.DTOs.Faculty.FacultyDashboardStatsDTO;
import com.example.backend.DTOs.Faculty.FacultyStudentDTO;
import com.example.backend.Services.FacultyDashboardService;
import com.example.backend.Utils.ApiResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/faculty/dashboard")
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
public class FacultyDashboardController {

    @Autowired
    private FacultyDashboardService facultyDashboardService;

    @AuditAction(action = "VIEW_FACULTY_DASHBOARD", targetEntity = "DASHBOARD_STATS")
    @GetMapping("/stats")
    public ResponseEntity<ApiResponse<FacultyDashboardStatsDTO>> getDashboardStats(
            @RequestParam(required = false, defaultValue = "faculty@dept.com") String facultyEmail) {

        FacultyDashboardStatsDTO stats = facultyDashboardService.getDepartmentStats(facultyEmail);
        return ResponseEntity.ok(ApiResponse.success("Faculty Dashboard stats retrieved successfully", stats));
    }

    @AuditAction(action = "VIEW_PENDING_VERIFICATIONS", targetEntity = "STUDENT_PROFILE")
    @GetMapping("/verifications/pending")
    public ResponseEntity<ApiResponse<List<FacultyStudentDTO>>> getPendingVerifications(
            @RequestParam(required = false, defaultValue = "faculty@dept.com") String facultyEmail) {

        List<FacultyStudentDTO> students = facultyDashboardService.getPendingVerifications(facultyEmail);
        return ResponseEntity.ok(ApiResponse.success("Pending verifications retrieved successfully", students));
    }

    @AuditAction(action = "VIEW_RECENT_VERIFICATIONS", targetEntity = "STUDENT_PROFILE")
    @GetMapping("/verifications/recent")
    public ResponseEntity<ApiResponse<List<FacultyStudentDTO>>> getRecentVerifications(
            @RequestParam(required = false, defaultValue = "faculty@dept.com") String facultyEmail) {

        List<FacultyStudentDTO> students = facultyDashboardService.getRecentVerifications(facultyEmail);
        return ResponseEntity.ok(ApiResponse.success("Recently verified students retrieved successfully", students));
    }
}
