package com.example.backend.Services;

import com.example.backend.DTOs.AuthRequestDto;
import com.example.backend.DTOs.AuthResponseDto;
import com.example.backend.Exceptions.UnauthorizedException;
import com.example.backend.Models.StudentProfile;
import com.example.backend.Models.User;
import com.example.backend.Models.enums.Role;
import com.example.backend.Models.enums.VerificationStatus;
import com.example.backend.Repositories.StudentProfileRepository;
import com.example.backend.Repositories.UserRepository;
import com.example.backend.Utils.JwtUtils;
import com.example.backend.Utils.SecurityUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class StudentAuthService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private StudentProfileRepository studentProfileRepository;

    @Autowired
    private JwtUtils jwtUtils;

    @Autowired
    private com.example.backend.Repositories.DepartmentRepository departmentRepository;

    public AuthResponseDto login(AuthRequestDto request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new UnauthorizedException("Invalid email or password"));

        if (!SecurityUtils.checkPassword(request.getPassword(), user.getPasswordHash())) {
            throw new UnauthorizedException("Invalid email or password");
        }

        if (user.getRole() != Role.STUDENT) {
            throw new UnauthorizedException("Access denied: Not a student account");
        }

        String token = jwtUtils.generateToken(user.getEmail(), user.getRole().name());

        return AuthResponseDto.builder()
                .token(token)
                .role(user.getRole().name())
                .email(user.getEmail())
                .name(user.getUniversityRegNo()) // Just returning reg no as name for base
                .build();
    }

    @Transactional
    public void register(AuthRequestDto request, String universityRegNo, String departmentCode) {
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new IllegalArgumentException("Email already exists");
        }
        if (userRepository.findByUniversityRegNo(universityRegNo).isPresent()) {
            throw new IllegalArgumentException("University Registration Number already exists");
        }
        if (departmentCode == null || departmentCode.trim().isEmpty()) {
            throw new IllegalArgumentException("Department code is required");
        }

        String normalizedDepartmentCode = departmentCode.trim().toUpperCase();
        com.example.backend.Models.Department department = departmentRepository.findByCode(normalizedDepartmentCode)
                .or(() -> departmentRepository.findByName(normalizedDepartmentCode))
                .orElseThrow(() -> new IllegalArgumentException("Invalid department code: " + departmentCode));

        User user = User.builder()
                .email(request.getEmail())
                .universityRegNo(universityRegNo)
                .passwordHash(SecurityUtils.hashPassword(request.getPassword()))
                .role(Role.STUDENT)
                .department(department)
                .isActive(true)
                .build();

        user = userRepository.save(user);

        StudentProfile profile = StudentProfile.builder()
                .user(user)
                .verificationStatus(VerificationStatus.PENDING)
                .isLocked(false)
                .isEligibleForPlacements(false)
                .eligibleForAdminReview(false)
                .interestedOnPlacement(true)
                .isPlaced(false)
                .numberOfOffers(0)
                .build();

        studentProfileRepository.save(profile);
    }
}
