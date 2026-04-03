package com.example.backend.Controllers;

import com.example.backend.DTOs.Admin.DriveApplicationDTO;
import com.example.backend.Services.AdminShortlistService;
import com.example.backend.Utils.ApiResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/eligible-students")
public class AdminEligibleStudentController {

    @Autowired
    private AdminShortlistService adminShortlistService;

    @GetMapping("/{driveId}")
    public ResponseEntity<ApiResponse<List<DriveApplicationDTO>>> getEligibleStudents(@PathVariable Long driveId) {
        List<DriveApplicationDTO> response = adminShortlistService.getFacultyApprovedApplicants(driveId);
        return ResponseEntity.ok(ApiResponse.success("Eligible students fetched successfully", response));
    }

    @GetMapping("/drives/{driveId}/students")
    public ResponseEntity<ApiResponse<List<DriveApplicationDTO>>> getDriveStudents(@PathVariable Long driveId) {
        List<DriveApplicationDTO> response = adminShortlistService.getFacultyApprovedApplicants(driveId);
        return ResponseEntity.ok(ApiResponse.success("Drive students fetched successfully", response));
    }
}
