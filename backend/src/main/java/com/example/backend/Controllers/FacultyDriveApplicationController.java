package com.example.backend.Controllers;

import com.example.backend.AOPs.AuditAction;
import com.example.backend.DTOs.Faculty.FacultyApplicationDTO;
import com.example.backend.Services.FacultyDriveService;
import com.example.backend.Utils.ApiResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/faculty/drive")
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
public class FacultyDriveApplicationController {

    @Autowired
    private FacultyDriveService facultyDriveService;

    @AuditAction(action = "VIEW_DRIVE_APPLICATIONS", targetEntity = "DRIVE_APPLICATION")
    @GetMapping("/{driveId}/applications")
    public ResponseEntity<ApiResponse<List<FacultyApplicationDTO>>> getDriveApplications(
            @PathVariable Long driveId,
            @RequestParam(required = false, defaultValue = "faculty@dept.com") String facultyEmail) {

        List<FacultyApplicationDTO> applications = facultyDriveService.getDriveParticipants(driveId, facultyEmail);
        return ResponseEntity.ok(ApiResponse.success("Drive applications retrieved successfully", applications));
    }
}
