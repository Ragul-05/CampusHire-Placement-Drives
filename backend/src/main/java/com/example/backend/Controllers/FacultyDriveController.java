package com.example.backend.Controllers;

import com.example.backend.AOPs.AuditAction;
import com.example.backend.DTOs.Faculty.*;
import com.example.backend.Exceptions.ResourceNotFoundException;
import com.example.backend.Models.enums.DriveStatus;
import com.example.backend.Services.FacultyDriveService;
import com.example.backend.Services.FacultyDriveFilteringService;
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

    @Autowired
    private FacultyDriveFilteringService driveFilteringService;

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

    @AuditAction(action = "VIEW_ACTIVE_DRIVES", targetEntity = "PLACEMENT_DRIVE")
    @GetMapping("/active")
    public ResponseEntity<ApiResponse<List<FacultyDriveDTO>>> getActiveDrives(
            @RequestParam(required = false, defaultValue = "faculty@dept.com") String facultyEmail) {

        List<FacultyDriveDTO> drives = facultyDriveService.getDepartmentDrives(facultyEmail, List.of(DriveStatus.UPCOMING, DriveStatus.ONGOING));
        return ResponseEntity.ok(ApiResponse.success("Active drives retrieved successfully", drives));
    }

    @AuditAction(action = "FILTER_ELIGIBLE_STUDENTS", targetEntity = "PLACEMENT_DRIVE")
    @GetMapping("/{driveId}/filter-eligible")
    public ResponseEntity<ApiResponse<DriveFilterResultDTO>> filterEligibleStudents(
            @PathVariable Long driveId,
            @RequestParam(required = false, defaultValue = "faculty@dept.com") String facultyEmail) {

        DriveFilterResultDTO result = driveFilteringService.filterEligibleStudentsForDrive(driveId, facultyEmail);
        return ResponseEntity.ok(ApiResponse.success("Students filtered successfully", result));
    }

    @AuditAction(action = "UPDATE_STUDENT_STAGE", targetEntity = "DRIVE_APPLICATION")
    @PostMapping("/{studentId}/stage")
    public ResponseEntity<ApiResponse<Void>> updateStudentStage(
            @PathVariable Long studentId,
            @RequestBody StageUpdateRequestDTO request,
            @RequestParam(required = false, defaultValue = "faculty@dept.com") String facultyEmail) {

        driveFilteringService.updateApplicationStage(studentId, request.getDriveId(), request.getStage(), facultyEmail);
        return ResponseEntity.ok(ApiResponse.success("Student stage updated successfully", null));
    }

    @AuditAction(action = "TOGGLE_STUDENT_APPROVAL", targetEntity = "DRIVE_APPLICATION")
    @PostMapping("/{studentId}/approve")
    public ResponseEntity<ApiResponse<Void>> toggleStudentApproval(
            @PathVariable Long studentId,
            @RequestBody ApprovalRequestDTO request,
            @RequestParam(required = false, defaultValue = "faculty@dept.com") String facultyEmail) {

        driveFilteringService.toggleFacultyApproval(studentId, request.getDriveId(), request.isApproved(), facultyEmail);
        return ResponseEntity.ok(ApiResponse.success("Student approval toggled successfully", null));
    }

    @AuditAction(action = "VIEW_DRIVE_APPLICATIONS", targetEntity = "DRIVE_APPLICATION")
    @GetMapping("/legacy/{driveId}/applications")
    public ResponseEntity<ApiResponse<List<FacultyApplicationDTO>>> getDriveApplicationsLegacy(
            @PathVariable Long driveId,
            @RequestParam(required = false, defaultValue = "faculty@dept.com") String facultyEmail) {

        List<FacultyApplicationDTO> participants = facultyDriveService.getDriveParticipants(driveId, facultyEmail);
        return ResponseEntity.ok(ApiResponse.success("Drive applications retrieved successfully", participants));
    }
}
