package com.example.backend.Controllers;

import com.example.backend.DTOs.PlacementDriveDto;
import com.example.backend.Services.StudentDriveService;
import com.example.backend.Utils.ApiResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/student/drives")
public class StudentDriveController {

    @Autowired
    private StudentDriveService studentDriveService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<PlacementDriveDto>>> getVisibleDrives(@RequestParam String email) {
        return ResponseEntity
                .ok(ApiResponse.success("Visible drives fetched", studentDriveService.getVisibleDrives(email)));
    }

    @GetMapping("/eligible")
    public ResponseEntity<ApiResponse<List<PlacementDriveDto>>> getEligibleDrives(@RequestParam String email) {
        return ResponseEntity
                .ok(ApiResponse.success("Eligible drives fetched", studentDriveService.getEligibleDrives(email)));
    }

    @GetMapping("/{driveId}")
    public ResponseEntity<ApiResponse<PlacementDriveDto>> getDriveDetails(@RequestParam String email,
            @PathVariable Long driveId) {
        return ResponseEntity
                .ok(ApiResponse.success("Drive details fetched", studentDriveService.getDriveDetails(email, driveId)));
    }
}
