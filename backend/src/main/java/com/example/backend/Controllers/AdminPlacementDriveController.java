package com.example.backend.Controllers;

import com.example.backend.AOPs.AuditAction;
import com.example.backend.DTOs.Admin.DriveApplicationDTO;
import com.example.backend.DTOs.Admin.PlacementDriveRequestDTO;
import com.example.backend.DTOs.Admin.PlacementDriveResponseDTO;
import com.example.backend.Models.enums.DriveStatus;
import com.example.backend.Services.AdminPlacementDriveService;
import com.example.backend.Services.AdminShortlistService;
import com.example.backend.Utils.ApiResponse;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/drives")
public class AdminPlacementDriveController {

    @Autowired
    private AdminPlacementDriveService placementDriveService;

    @Autowired
    private AdminShortlistService adminShortlistService;

    @PostMapping
    @AuditAction(action = "CREATE_DRIVE", targetEntity = "PlacementDrive")
    public ResponseEntity<ApiResponse<PlacementDriveResponseDTO>> createDrive(
            @RequestParam(required = false) String email,
            @Valid @RequestBody PlacementDriveRequestDTO dto) {
        PlacementDriveResponseDTO response = placementDriveService.createDrive(dto);
        return ResponseEntity.ok(ApiResponse.success("Placement drive created successfully", response));
    }

    @PutMapping("/{driveId}")
    @AuditAction(action = "UPDATE_DRIVE", targetEntity = "PlacementDrive")
    public ResponseEntity<ApiResponse<PlacementDriveResponseDTO>> updateDrive(
            @RequestParam(required = false) String email,
            @PathVariable Long driveId,
            @Valid @RequestBody PlacementDriveRequestDTO dto) {
        PlacementDriveResponseDTO response = placementDriveService.updateDrive(driveId, dto);
        return ResponseEntity.ok(ApiResponse.success("Placement drive updated successfully", response));
    }

    @PatchMapping("/{driveId}/status")
    @AuditAction(action = "CHANGE_DRIVE_STATUS", targetEntity = "PlacementDrive")
    public ResponseEntity<ApiResponse<PlacementDriveResponseDTO>> changeDriveStatus(
            @RequestParam(required = false) String email,
            @PathVariable Long driveId,
            @RequestParam DriveStatus status) {
        PlacementDriveResponseDTO response = placementDriveService.updateDriveStatus(driveId, status);
        return ResponseEntity.ok(ApiResponse.success("Placement drive status updated successfully", response));
    }

    @GetMapping("/{driveId}")
    public ResponseEntity<ApiResponse<PlacementDriveResponseDTO>> getDriveById(@PathVariable Long driveId) {
        return ResponseEntity.ok(ApiResponse.success("Placement drive fetched successfully",
                placementDriveService.getDriveById(driveId)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<PlacementDriveResponseDTO>>> getAllDrives() {
        return ResponseEntity
                .ok(ApiResponse.success("Placement drives fetched successfully", placementDriveService.getAllDrives()));
    }

    @GetMapping("/{driveId}/students")
    public ResponseEntity<ApiResponse<List<DriveApplicationDTO>>> getDriveStudents(@PathVariable Long driveId) {
        return ResponseEntity.ok(ApiResponse.success(
                "Drive students fetched successfully",
                adminShortlistService.getFacultyApprovedApplicants(driveId)
        ));
    }
}
