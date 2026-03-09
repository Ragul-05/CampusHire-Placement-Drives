package com.example.backend.Controllers;

import com.example.backend.AOPs.AuditAction;
import com.example.backend.DTOs.Faculty.FacultyApplicationDTO;
import com.example.backend.DTOs.Faculty.FacultyDriveDTO;
import com.example.backend.Models.enums.DriveStatus;
import com.example.backend.Services.FacultyDriveService;
import com.example.backend.Utils.ApiResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/faculty/drives")
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
public class FacultyDriveController {

    @Autowired
    private FacultyDriveService facultyDriveService;

    @AuditAction(action = "VIEW_DEPARTMENT_DRIVES", targetEntity = "PLACEMENT_DRIVE")
    @GetMapping
    public ResponseEntity<ApiResponse<List<FacultyDriveDTO>>> getDepartmentDrives(
            @RequestParam(required = false) List<DriveStatus> statuses,
            @RequestParam(required = false, defaultValue = "faculty@dept.com") String facultyEmail) {

        List<FacultyDriveDTO> drives = facultyDriveService.getDepartmentDrives(facultyEmail, statuses);
        return ResponseEntity.ok(ApiResponse.success("Department drives retrieved successfully", drives));
    }

    @AuditAction(action = "VIEW_DRIVE_PARTICIPANTS", targetEntity = "DRIVE_APPLICATION")
    @GetMapping("/{driveId}/participants")
    public ResponseEntity<ApiResponse<List<FacultyApplicationDTO>>> getDriveParticipants(
            @PathVariable Long driveId,
            @RequestParam(required = false, defaultValue = "faculty@dept.com") String facultyEmail) {

        List<FacultyApplicationDTO> participants = facultyDriveService.getDriveParticipants(driveId, facultyEmail);
        return ResponseEntity.ok(ApiResponse.success("Drive participants retrieved successfully", participants));
    }
}
