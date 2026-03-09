package com.example.backend.Controllers;

import com.example.backend.AOPs.AuditAction;
import com.example.backend.DTOs.Faculty.FacultyAnalyticsDTO;
import com.example.backend.Services.FacultyAnalyticsService;
import com.example.backend.Utils.ApiResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/faculty/analytics")
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
public class FacultyAnalyticsController {

    @Autowired
    private FacultyAnalyticsService facultyAnalyticsService;

    @AuditAction(action = "VIEW_DEPARTMENT_ANALYTICS", targetEntity = "ANALYTICS")
    @GetMapping
    public ResponseEntity<ApiResponse<FacultyAnalyticsDTO>> getDepartmentAnalytics(
            @RequestParam(required = false, defaultValue = "faculty@dept.com") String facultyEmail) {

        FacultyAnalyticsDTO analytics = facultyAnalyticsService.getDepartmentAnalytics(facultyEmail);
        return ResponseEntity.ok(ApiResponse.success("Department analytics retrieved successfully", analytics));
    }
}
