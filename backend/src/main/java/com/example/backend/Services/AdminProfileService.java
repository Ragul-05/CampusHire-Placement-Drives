package com.example.backend.Services;

import com.example.backend.DTOs.Admin.AdminProfileDTO;
import com.example.backend.DTOs.Admin.AdminProfileUpdateDTO;
import com.example.backend.Exceptions.ResourceNotFoundException;
import com.example.backend.Models.Department;
import com.example.backend.Models.User;
import com.example.backend.Repositories.DepartmentRepository;
import com.example.backend.Repositories.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AdminProfileService {

    private UserRepository userRepository;

    private DepartmentRepository departmentRepository;

    private PasswordEncoder passwordEncoder;

    public AdminProfileService(UserRepository userRepository, DepartmentRepository departmentRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.departmentRepository = departmentRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public AdminProfileDTO getAdminProfile(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        // Verify role
        if (!"PLACEMENT_HEAD".equals(user.getRole().name())) {
            throw new SecurityException("Access denied: Only PLACEMENT_HEAD can access this resource");
        }

        String departmentName = null;
        Long departmentId = null;
        if (user.getDepartment() != null) {
            departmentName = user.getDepartment().getName();
            departmentId = user.getDepartment().getId();
        }

        return AdminProfileDTO.builder()
                .id(user.getId())
                .email(user.getEmail())
                .role(user.getRole().name())
                .universityRegNo(user.getUniversityRegNo())
                .departmentId(departmentId)
                .departmentName(departmentName)
                .isActive(user.getIsActive())
                .createdAt(null) // User model doesn't have createdAt
                .build();
    }

    @Transactional
    public AdminProfileDTO updateAdminProfile(Long userId, AdminProfileUpdateDTO updateDTO) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        // Verify role
        if (!"PLACEMENT_HEAD".equals(user.getRole().name())) {
            throw new SecurityException("Access denied: Only PLACEMENT_HEAD can access this resource");
        }

        // Update email if provided
        if (updateDTO.getEmail() != null && !updateDTO.getEmail().trim().isEmpty()) {
            String newEmail = updateDTO.getEmail().trim();

            // Check if email is different
            if (!newEmail.equals(user.getEmail())) {
                // Check uniqueness
                if (userRepository.findByEmail(newEmail).isPresent()) {
                    throw new IllegalArgumentException("Email already exists");
                }
                user.setEmail(newEmail);
            }
        }

        // Update password if provided
        if (updateDTO.getPassword() != null && !updateDTO.getPassword().trim().isEmpty()) {
            String hashedPassword = passwordEncoder.encode(updateDTO.getPassword());
            user.setPasswordHash(hashedPassword);
        }

        user = userRepository.save(user);

        // Return updated profile
        return getAdminProfile(user.getId());
    }
}
