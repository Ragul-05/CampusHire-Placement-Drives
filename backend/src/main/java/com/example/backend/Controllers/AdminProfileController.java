package com.example.backend.Controllers;

import com.example.backend.AOPs.AuditAction;
import com.example.backend.DTOs.Admin.AdminProfileDTO;
import com.example.backend.DTOs.Admin.AdminProfileUpdateDTO;
import com.example.backend.Security.CustomUserDetails;
import com.example.backend.Services.AdminProfileService;
import com.example.backend.Utils.ApiResponse;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/profile")
@PreAuthorize("hasRole('PLACEMENT_HEAD')")
public class AdminProfileController {

    @Autowired
    private AdminProfileService profileService;

    @GetMapping
    public ResponseEntity<ApiResponse<AdminProfileDTO>> getProfile() {
        Long userId = getCurrentUserId();
        AdminProfileDTO profile = profileService.getAdminProfile(userId);
        return ResponseEntity.ok(ApiResponse.success("Profile fetched successfully", profile));
    }

    @PutMapping
    @AuditAction(action = "UPDATE_ADMIN_PROFILE", targetEntity = "Users")
    public ResponseEntity<ApiResponse<AdminProfileDTO>> updateProfile(
            @Valid @RequestBody AdminProfileUpdateDTO updateDTO) {
        Long userId = getCurrentUserId();
        AdminProfileDTO profile = profileService.updateAdminProfile(userId, updateDTO);
        return ResponseEntity.ok(ApiResponse.success("Profile updated successfully", profile));
    }

    private Long getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof CustomUserDetails) {
            CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
            return userDetails.getUser().getId();
        }
        throw new SecurityException("User not authenticated");
    }
}

