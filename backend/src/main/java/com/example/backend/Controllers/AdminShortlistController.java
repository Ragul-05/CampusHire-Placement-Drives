package com.example.backend.Controllers;

import com.example.backend.AOPs.AuditAction;
import com.example.backend.DTOs.Admin.DriveApplicationDTO;
import com.example.backend.DTOs.Admin.ShortlistRequestDTO;
import com.example.backend.Services.AdminShortlistService;
import com.example.backend.Utils.ApiResponse;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/drives/{driveId}/shortlist")
public class AdminShortlistController {

    @Autowired
    private AdminShortlistService adminShortlistService;

    @GetMapping("/eligible")
    public ResponseEntity<ApiResponse<List<DriveApplicationDTO>>> getEligibleApplicants(@PathVariable Long driveId) {
        List<DriveApplicationDTO> response = adminShortlistService.getEligibleApplicants(driveId);
        return ResponseEntity.ok(ApiResponse.success("Eligible applicants fetched successfully", response));
    }

    @GetMapping("/eligible-students-alias")
    public ResponseEntity<ApiResponse<List<DriveApplicationDTO>>> getEligibleStudentsAlias(@PathVariable Long driveId) {
        List<DriveApplicationDTO> response = adminShortlistService.getFacultyApprovedApplicants(driveId);
        return ResponseEntity.ok(ApiResponse.success("Eligible students fetched successfully", response));
    }

    @GetMapping("/students")
    public ResponseEntity<ApiResponse<List<DriveApplicationDTO>>> getDriveStudents(@PathVariable Long driveId) {
        List<DriveApplicationDTO> response = adminShortlistService.getFacultyApprovedApplicants(driveId);
        return ResponseEntity.ok(ApiResponse.success("Drive students fetched successfully", response));
    }

    @PostMapping("/generate")
    @AuditAction(action = "GENERATE_SHORTLIST", targetEntity = "PlacementDrive")
    public ResponseEntity<ApiResponse<List<DriveApplicationDTO>>> generateShortlist(
            @RequestParam(required = false, defaultValue = "admin@campushire.com") String email,
            @PathVariable Long driveId,
            @Valid @RequestBody ShortlistRequestDTO request) {
        List<DriveApplicationDTO> response = adminShortlistService.generateShortlist(driveId, request, email);
        return ResponseEntity.ok(ApiResponse.success("Shortlist generated successfully", response));
    }
}
