package com.example.backend.Controllers;

import com.example.backend.AOPs.AuditAction;
import com.example.backend.DTOs.Admin.OfferRequestDTO;
import com.example.backend.DTOs.Admin.OfferResponseDTO;
import com.example.backend.Services.AdminFinalPlacementService;
import com.example.backend.Utils.ApiResponse;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/drives/{driveId}/placements")
public class AdminFinalPlacementController {

    @Autowired
    private AdminFinalPlacementService placementService;

    @PostMapping("/offers")
    @AuditAction(action = "RECORD_OFFER", targetEntity = "Offer")
    public ResponseEntity<ApiResponse<OfferResponseDTO>> recordOffer(
            @RequestParam(required = false) String email,
            @PathVariable Long driveId,
            @Valid @RequestBody OfferRequestDTO request) {
        OfferResponseDTO response = placementService.recordOffer(driveId, request);
        return ResponseEntity.ok(ApiResponse.success("Offer recorded successfully", response));
    }

    @GetMapping("/offers")
    public ResponseEntity<ApiResponse<List<OfferResponseDTO>>> getOffersByDrive(@PathVariable Long driveId) {
        return ResponseEntity
                .ok(ApiResponse.success("Offers fetched successfully", placementService.getOffersByDrive(driveId)));
    }

    @PatchMapping("/complete")
    @AuditAction(action = "MARK_DRIVE_COMPLETED", targetEntity = "PlacementDrive")
    public ResponseEntity<ApiResponse<String>> markDriveCompleted(
            @RequestParam(required = false) String email,
            @PathVariable Long driveId) {
        placementService.markDriveCompleted(driveId);
        return ResponseEntity.ok(ApiResponse.success("Drive marked as completed successfully", null));
    }
}
