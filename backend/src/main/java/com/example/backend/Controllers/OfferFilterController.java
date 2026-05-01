package com.example.backend.Controllers;

import com.example.backend.DTOs.Offers.OfferFilterResponseDTO;
import com.example.backend.Services.OfferFilterService;
import com.example.backend.Utils.ApiResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
public class OfferFilterController {

    @Autowired
    private OfferFilterService offerFilterService;

    @GetMapping("/api/admin/offer-filters")
    public ResponseEntity<ApiResponse<OfferFilterResponseDTO>> getAdminOfferFilters(
            @RequestParam(required = false) String offerFilter) {
        return ResponseEntity.ok(ApiResponse.success(
                "Offer filters fetched successfully",
                offerFilterService.getAdminOfferFilters(offerFilter)
        ));
    }

    @GetMapping("/api/faculty/offer-filters")
    public ResponseEntity<ApiResponse<OfferFilterResponseDTO>> getFacultyOfferFilters(
            @RequestParam String facultyEmail,
            @RequestParam(required = false) String offerFilter) {
        return ResponseEntity.ok(ApiResponse.success(
                "Offer filters fetched successfully",
                offerFilterService.getFacultyOfferFilters(facultyEmail, offerFilter)
        ));
    }
}
