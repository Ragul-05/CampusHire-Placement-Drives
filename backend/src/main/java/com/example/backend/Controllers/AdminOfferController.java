package com.example.backend.Controllers;

import com.example.backend.DTOs.Admin.OfferResponseDTO;
import com.example.backend.Services.AdminFinalPlacementService;
import com.example.backend.Utils.ApiResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
public class AdminOfferController {

    @Autowired
    private AdminFinalPlacementService placementService;

    @GetMapping("/offers")
    public ResponseEntity<ApiResponse<List<OfferResponseDTO>>> getAllOffers() {
        return ResponseEntity.ok(ApiResponse.success("Offers fetched successfully", placementService.getAllOffers()));
    }
}
