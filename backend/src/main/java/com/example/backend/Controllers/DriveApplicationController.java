package com.example.backend.Controllers;

import com.example.backend.DTOs.DriveApplicationDto;
import com.example.backend.Services.DriveApplicationService;
import com.example.backend.Utils.ApiResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/student/applications")
public class DriveApplicationController {

    @Autowired
    private DriveApplicationService driveApplicationService;

    @PostMapping("/{driveId}/apply")
    public ResponseEntity<ApiResponse<Void>> applyForDrive(@RequestParam String email, @PathVariable Long driveId) {
        driveApplicationService.applyForDrive(email, driveId);
        return ResponseEntity.ok(ApiResponse.success("Successfully applied for the drive", null));
    }

    @PostMapping("/apply/{driveId}")
    public ResponseEntity<ApiResponse<Void>> applyForDriveLegacy(@RequestParam String email, @PathVariable Long driveId) {
        driveApplicationService.applyForDrive(email, driveId);
        return ResponseEntity.ok(ApiResponse.success("Successfully applied for the drive", null));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<DriveApplicationDto>>> getMyApplications(@RequestParam String email) {
        return ResponseEntity
                .ok(ApiResponse.success("Applications fetched", driveApplicationService.getMyApplications(email)));
    }
}
