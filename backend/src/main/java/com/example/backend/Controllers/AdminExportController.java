package com.example.backend.Controllers;

import com.example.backend.AOPs.AuditAction;
import com.example.backend.Services.AdminExportService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/export")
public class AdminExportController {

    @Autowired
    private AdminExportService exportService;

    @GetMapping("/students")
    @AuditAction(action = "EXPORT_STUDENTS", targetEntity = "StudentProfile")
    public ResponseEntity<byte[]> exportVerifiedStudents(@RequestParam(required = false) String email) {
        String csvData = exportService.exportVerifiedStudentsCsv();
        byte[] output = csvData.getBytes();

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"students.csv\"")
                .contentType(MediaType.parseMediaType("text/csv"))
                .body(output);
    }

    @GetMapping("/drives/{driveId}/results")
    @AuditAction(action = "EXPORT_DRIVE_RESULTS", targetEntity = "PlacementDrive")
    public ResponseEntity<byte[]> exportDriveResults(
            @RequestParam(required = false) String email,
            @PathVariable Long driveId) {
        String csvData = exportService.exportDriveResultsCsv(driveId);
        byte[] output = csvData.getBytes();

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"drive_" + driveId + "_results.csv\"")
                .contentType(MediaType.parseMediaType("text/csv"))
                .body(output);
    }
}
