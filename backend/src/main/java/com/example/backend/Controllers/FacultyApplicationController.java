package com.example.backend.Controllers;

import com.example.backend.AOPs.AuditAction;
import com.example.backend.DTOs.Faculty.FacultyApplicationDTO;
import com.example.backend.DTOs.Faculty.StageUpdateRequestDTO;
import com.example.backend.Services.FacultyApplicationService;
import com.example.backend.Utils.ApiResponse;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/faculty/applications")
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
public class FacultyApplicationController {

    @Autowired
    private FacultyApplicationService facultyApplicationService;

    @AuditAction(action = "VIEW_DEPARTMENT_APPLICATIONS", targetEntity = "DRIVE_APPLICATION")
    @GetMapping
    public ResponseEntity<ApiResponse<List<FacultyApplicationDTO>>> getDepartmentApplications(
            @RequestParam(required = false, defaultValue = "faculty@dept.com") String facultyEmail) {

        List<FacultyApplicationDTO> applications = facultyApplicationService.getDepartmentApplications(facultyEmail);
        return ResponseEntity.ok(ApiResponse.success("Department applications retrieved successfully", applications));
    }

    @AuditAction(action = "UPDATE_APPLICATION_STAGE", targetEntity = "DRIVE_APPLICATION")
    @PutMapping("/{id}/stage")
    public ResponseEntity<ApiResponse<Void>> updateApplicationStage(
            @PathVariable Long id,
            @Valid @RequestBody StageUpdateRequestDTO request,
            @RequestParam(required = false, defaultValue = "faculty@dept.com") String facultyEmail) {

        facultyApplicationService.updateApplicationStage(id, request, facultyEmail);
        return ResponseEntity.ok(ApiResponse.success("Application stage updated successfully", null));
    }
}
