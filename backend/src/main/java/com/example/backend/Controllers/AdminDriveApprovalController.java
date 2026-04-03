package com.example.backend.Controllers;

import com.example.backend.DTOs.Admin.AdminStageUpdateRequestDTO;
import com.example.backend.DTOs.Admin.DriveApplicationDTO;
import com.example.backend.Services.AdminShortlistService;
import com.example.backend.Utils.ApiResponse;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
public class AdminDriveApprovalController {

    @Autowired
    private AdminShortlistService adminShortlistService;

    @GetMapping("/approved-students/{driveId}")
    public ResponseEntity<ApiResponse<List<DriveApplicationDTO>>> getApprovedStudents(@PathVariable Long driveId) {
        List<DriveApplicationDTO> response = adminShortlistService.getFacultyApprovedApplicants(driveId);
        return ResponseEntity.ok(ApiResponse.success("Faculty-approved students fetched successfully", response));
    }

    @PutMapping("/update-stage")
    public ResponseEntity<ApiResponse<DriveApplicationDTO>> updateStage(
            @RequestParam(required = false, defaultValue = "admin@campushire.com") String email,
            @Valid @RequestBody AdminStageUpdateRequestDTO request) {

        DriveApplicationDTO response = adminShortlistService.updateAdminStage(request, email);
        return ResponseEntity.ok(ApiResponse.success("Student stage updated successfully", response));
    }
}
