package com.example.backend.Services;

import com.example.backend.DTOs.AuthRequestDto;
import com.example.backend.DTOs.AuthResponseDto;
import com.example.backend.DTOs.RefreshTokenRequestDto;
import com.example.backend.Exceptions.UnauthorizedException;
import com.example.backend.Models.User;
import com.example.backend.Utils.JwtUtils;
import com.example.backend.Utils.SecurityUtils;
import com.example.backend.Repositories.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JwtUtils jwtUtils;

    public AuthResponseDto login(AuthRequestDto request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new UnauthorizedException("Invalid email or password"));

        if (!SecurityUtils.checkPassword(request.getPassword(), user.getPasswordHash())) {
            throw new UnauthorizedException("Invalid email or password");
        }

        if (user.getIsActive() != null && !user.getIsActive()) {
            throw new UnauthorizedException("Account is inactive");
        }

        String token = jwtUtils.generateAccessToken(user.getEmail(), user.getRole().name());
        String refreshToken = jwtUtils.generateRefreshToken(user.getEmail(), user.getRole().name());

        return AuthResponseDto.builder()
                .token(token)
                .refreshToken(refreshToken)
                .role(user.getRole().name())
                .email(user.getEmail())
                .name(user.getUniversityRegNo())
                .build();
    }

    public AuthResponseDto refresh(RefreshTokenRequestDto request) {
        if (request.getRefreshToken() == null || request.getRefreshToken().isBlank()) {
            throw new UnauthorizedException("Refresh token is required");
        }
        if (!jwtUtils.validateRefreshToken(request.getRefreshToken())) {
            throw new UnauthorizedException("Refresh token is invalid or expired");
        }

        String email = jwtUtils.getEmailFromToken(request.getRefreshToken());
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UnauthorizedException("User not found"));

        if (user.getIsActive() != null && !user.getIsActive()) {
            throw new UnauthorizedException("Account is inactive");
        }

        return AuthResponseDto.builder()
                .token(jwtUtils.generateAccessToken(user.getEmail(), user.getRole().name()))
                .refreshToken(jwtUtils.generateRefreshToken(user.getEmail(), user.getRole().name()))
                .role(user.getRole().name())
                .email(user.getEmail())
                .name(user.getUniversityRegNo())
                .build();
    }
}
