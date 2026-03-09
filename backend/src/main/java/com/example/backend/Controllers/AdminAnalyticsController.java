package com.example.backend.Controllers;

import com.example.backend.DTOs.Admin.AnalyticsResponseDTO;
import com.example.backend.Services.AdminAnalyticsService;
import com.example.backend.Utils.ApiResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/analytics")
public class AdminAnalyticsController {

    @Autowired
    private AdminAnalyticsService analyticsService;

    @GetMapping("/placements")
    public ResponseEntity<ApiResponse<AnalyticsResponseDTO>> getPlacementAnalytics() {
        AnalyticsResponseDTO stats = analyticsService.getPlacementAnalytics();
        return ResponseEntity.ok(ApiResponse.success("Placement analytics fetched successfully", stats));
    }
}
