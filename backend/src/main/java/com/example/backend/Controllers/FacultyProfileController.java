package com.example.backend.Controllers;

import com.example.backend.DTOs.Admin.AdminProfileDTO;
import com.example.backend.DTOs.Faculty.FacultyProfileUpdateDTO;
import com.example.backend.Exceptions.ResourceNotFoundException;
import com.example.backend.Exceptions.UnauthorizedException;
import com.example.backend.Models.User;
import com.example.backend.Repositories.UserRepository;
import com.example.backend.Security.CustomUserDetails;
import com.example.backend.Utils.ApiResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/faculty/profile")
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
public class FacultyProfileController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    /** GET /api/faculty/profile */
    @GetMapping
    @Transactional(readOnly = true)
    public ResponseEntity<ApiResponse<AdminProfileDTO>> getProfile() {
        User user = getCurrentUser();
        return ResponseEntity.ok(ApiResponse.success("Profile fetched successfully", buildDto(user)));
    }

    /** PUT /api/faculty/profile */
    @PutMapping
    @Transactional
    public ResponseEntity<ApiResponse<AdminProfileDTO>> updateProfile(
            @RequestBody FacultyProfileUpdateDTO updateDTO) {

        User user = getCurrentUser();

        // Update email if provided and changed
        if (updateDTO.getEmail() != null && !updateDTO.getEmail().trim().isEmpty()) {
            String newEmail = updateDTO.getEmail().trim();
            if (!newEmail.equals(user.getEmail())) {
                if (userRepository.findByEmail(newEmail).isPresent()) {
                    throw new IllegalArgumentException("Email already in use by another account");
                }
                user.setEmail(newEmail);
            }
        }

        // Update password if provided
        if (updateDTO.getPassword() != null && !updateDTO.getPassword().trim().isEmpty()) {
            String pwd = updateDTO.getPassword().trim();
            if (pwd.length() < 6) {
                throw new IllegalArgumentException("Password must be at least 6 characters");
            }
            user.setPasswordHash(passwordEncoder.encode(pwd));
        }

        User saved = userRepository.save(user);
        return ResponseEntity.ok(ApiResponse.success("Profile updated successfully", buildDto(saved)));
    }

    /* ── helpers ── */

    private User getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getPrincipal() instanceof CustomUserDetails)) {
            throw new UnauthorizedException("User not authenticated");
        }
        Long id = ((CustomUserDetails) auth.getPrincipal()).getUser().getId();
        return userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));
    }

    private AdminProfileDTO buildDto(User user) {
        // department is LAZY — safe here because method is @Transactional
        String deptName = (user.getDepartment() != null) ? user.getDepartment().getName() : null;
        Long   deptId   = (user.getDepartment() != null) ? user.getDepartment().getId()   : null;

        return AdminProfileDTO.builder()
                .id(user.getId())
                .email(user.getEmail())
                .role(user.getRole().name())
                .universityRegNo(user.getUniversityRegNo())
                .departmentId(deptId)
                .departmentName(deptName)
                .isActive(user.getIsActive())
                .createdAt(null)
                .build();
    }
}
