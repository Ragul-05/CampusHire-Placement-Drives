package com.example.backend.Controllers;

import com.example.backend.DTOs.Admin.ParticipationStatsDTO;
import com.example.backend.Services.AdminParticipationService;
import com.example.backend.Utils.ApiResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/drives/{driveId}/participation")
public class AdminParticipationController {

    @Autowired
    private AdminParticipationService participationService;

    @GetMapping
    public ResponseEntity<ApiResponse<ParticipationStatsDTO>> getParticipationStats(@PathVariable Long driveId) {
        ParticipationStatsDTO stats = participationService.getDriveParticipationStats(driveId);
        return ResponseEntity.ok(ApiResponse.success("Participation stats fetched successfully", stats));
    }
}
