package com.example.backend.Controllers;

import com.example.backend.DTOs.Results.PlacementResultsResponseDTO;
import com.example.backend.Exceptions.ResourceNotFoundException;
import com.example.backend.Models.User;
import com.example.backend.Models.enums.Role;
import com.example.backend.Repositories.UserRepository;
import com.example.backend.Services.PlacementResultsService;
import com.example.backend.Utils.ApiResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
public class PlacementResultsController {

    @Autowired
    private PlacementResultsService placementResultsService;

    @Autowired
    private UserRepository userRepository;

    @GetMapping("/api/placement-results")
    public ResponseEntity<ApiResponse<PlacementResultsResponseDTO>> getPlacementResults(
            @RequestParam(required = false) String email,
            @RequestParam(required = false) String facultyEmail,
            Authentication authentication) {

        User actor = resolveActor(authentication, email, facultyEmail);

        PlacementResultsResponseDTO response = actor.getRole() == Role.FACULTY
                ? placementResultsService.getFacultyPlacementResults(actor.getEmail())
                : placementResultsService.getAdminPlacementResults();

        return ResponseEntity.ok(ApiResponse.success("Placement results retrieved successfully", response));
    }

    @GetMapping("/api/admin/placement-results")
    public ResponseEntity<ApiResponse<PlacementResultsResponseDTO>> getAdminPlacementResults() {
        return getPlacementResults(null, null, null);
    }

    @GetMapping("/api/faculty/placement-results")
    public ResponseEntity<ApiResponse<PlacementResultsResponseDTO>> getFacultyPlacementResults(
            @RequestParam(required = false) String facultyEmail,
            Authentication authentication) {

        String resolvedEmail = resolveFacultyEmail(facultyEmail, authentication);
        return getPlacementResults(null, resolvedEmail, authentication);
    }

    private User resolveActor(Authentication authentication, String email, String facultyEmail) {
        String resolvedEmail = null;
        if (authentication != null && authentication.getName() != null && !authentication.getName().isBlank()) {
            resolvedEmail = authentication.getName();
        } else if (facultyEmail != null && !facultyEmail.isBlank()) {
            resolvedEmail = facultyEmail;
        } else if (email != null && !email.isBlank()) {
            resolvedEmail = email;
        }

        if (resolvedEmail == null || resolvedEmail.isBlank()) {
            // Backward-compatibility fallback for legacy admin callers with no auth context.
            return User.builder().email("admin@campushire.com").role(Role.PLACEMENT_HEAD).build();
        }

        return userRepository.findByEmail(resolvedEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    private String resolveFacultyEmail(String facultyEmail, Authentication authentication) {
        if (authentication != null && authentication.getName() != null && !authentication.getName().isBlank()) {
            return authentication.getName();
        }
        if (facultyEmail != null && !facultyEmail.isBlank()) {
            return facultyEmail;
        }
        throw new IllegalArgumentException("Faculty email could not be resolved from the current session");
    }
}
