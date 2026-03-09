package com.example.backend.Controllers;

import com.example.backend.AOPs.AuditAction;
import com.example.backend.DTOs.Faculty.FacultyStudentDTO;
import com.example.backend.Services.FacultyDriveFilteringService;
import com.example.backend.Utils.ApiResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/faculty/drives")
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
public class FacultyDriveFilteringController {

    @Autowired
    private FacultyDriveFilteringService driveFilteringService;

    @AuditAction(action = "VIEW_ACTIVE_DRIVES", targetEntity = "PLACEMENT_DRIVE")
    @GetMapping("/active")
    public ResponseEntity<ApiResponse<List<Object>>> getActiveDrives(
            @RequestParam(required = false, defaultValue = "faculty@dept.com") String facultyEmail) {

        List<Object> drives = driveFilteringService.getActiveDrivesForFaculty(facultyEmail);
        return ResponseEntity.ok(ApiResponse.success("Active drives retrieved successfully", drives));
    }

    @AuditAction(action = "FILTER_ELIGIBLE_STUDENTS", targetEntity = "PLACEMENT_DRIVE")
    @GetMapping("/{driveId}/filter-eligible")
    public ResponseEntity<ApiResponse<DriveFilterResult>> filterEligibleStudents(
            @PathVariable Long driveId,
            @RequestParam(required = false, defaultValue = "faculty@dept.com") String facultyEmail) {

        DriveFilterResult result = driveFilteringService.filterEligibleStudentsForDrive(driveId, facultyEmail);
        return ResponseEntity.ok(ApiResponse.success("Students filtered successfully", result));
    }

    @AuditAction(action = "UPDATE_STUDENT_STAGE", targetEntity = "DRIVE_APPLICATION")
    @PostMapping("/{studentId}/stage")
    public ResponseEntity<ApiResponse<Void>> updateStudentStage(
            @PathVariable Long studentId,
            @RequestBody StageUpdateRequest request,
            @RequestParam(required = false, defaultValue = "faculty@dept.com") String facultyEmail) {

        driveFilteringService.updateApplicationStage(studentId, request.getDriveId(), request.getStage(), facultyEmail);
        return ResponseEntity.ok(ApiResponse.success("Student stage updated successfully", null));
    }

    // Inner DTOs
    @lombok.Data
    @lombok.Builder
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class DriveFilterResult {
        private Object drive;
        private Long totalVerified;
        private List<FacultyStudentDTO> eligibleStudents;
        private java.util.Map<Long, List<String>> ineligibleReasons;
    }

    @lombok.Data
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class StageUpdateRequest {
        private Long driveId;
        private String stage;
    }
}
