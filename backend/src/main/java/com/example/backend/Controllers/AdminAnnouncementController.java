package com.example.backend.Controllers;

import com.example.backend.AOPs.AuditAction;
import com.example.backend.DTOs.Admin.AnnouncementRequestDTO;
import com.example.backend.DTOs.Admin.AnnouncementResponseDTO;
import com.example.backend.Services.AdminAnnouncementService;
import com.example.backend.Utils.ApiResponse;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/announcements")
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
public class AdminAnnouncementController {

    @Autowired
    private AdminAnnouncementService announcementService;

    // ── Announcements ────────────────────────────────────────────────────────

    @PostMapping
    @AuditAction(action = "CREATE_ANNOUNCEMENT", targetEntity = "Announcement")
    public ResponseEntity<ApiResponse<AnnouncementResponseDTO>> createAnnouncement(
            @Valid @RequestBody AnnouncementRequestDTO request) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        AnnouncementResponseDTO response = announcementService.createAnnouncement(request, email);
        return ResponseEntity.ok(ApiResponse.success("Announcement created successfully", response));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<AnnouncementResponseDTO>>> getAllAnnouncements() {
        return ResponseEntity.ok(
                ApiResponse.success("Announcements fetched successfully",
                        announcementService.getAllAnnouncements()));
    }

    @DeleteMapping("/{id}")
    @AuditAction(action = "DELETE_ANNOUNCEMENT", targetEntity = "Announcement")
    public ResponseEntity<ApiResponse<String>> deleteAnnouncement(@PathVariable Long id) {
        announcementService.deleteAnnouncement(id);
        return ResponseEntity.ok(ApiResponse.success("Announcement deleted successfully", null));
    }
}
