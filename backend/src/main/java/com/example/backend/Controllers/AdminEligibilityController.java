package com.example.backend.Controllers;

import com.example.backend.AOPs.AuditAction;
import com.example.backend.DTOs.Admin.EligibilityCriteriaDTO;
import com.example.backend.Services.AdminEligibilityService;
import com.example.backend.Utils.ApiResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/drives/{driveId}/eligibility")
public class AdminEligibilityController {

    @Autowired
    private AdminEligibilityService eligibilityService;

    @PostMapping
    @AuditAction(action = "SET_ELIGIBILITY", targetEntity = "EligibilityCriteria")
    public ResponseEntity<ApiResponse<EligibilityCriteriaDTO>> setEligibilityCriteria(
            @RequestParam(required = false) String email,
            @PathVariable Long driveId,
            @RequestBody EligibilityCriteriaDTO dto) {
        EligibilityCriteriaDTO response = eligibilityService.setEligibilityCriteria(driveId, dto);
        return ResponseEntity.ok(ApiResponse.success("Eligibility criteria set successfully", response));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<EligibilityCriteriaDTO>> getEligibilityCriteria(@PathVariable Long driveId) {
        return ResponseEntity.ok(ApiResponse.success("Eligibility criteria fetched successfully",
                eligibilityService.getEligibilityCriteria(driveId)));
    }
}
