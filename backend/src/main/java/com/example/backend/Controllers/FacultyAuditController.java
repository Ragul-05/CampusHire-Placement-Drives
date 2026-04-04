package com.example.backend.Controllers;

import com.example.backend.DTOs.Admin.AuditLogDTO;
import com.example.backend.Services.AdminAuditService;
import com.example.backend.Utils.ApiResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/faculty/audit")
public class FacultyAuditController {

    @Autowired
    private AdminAuditService auditService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<AuditLogDTO>>> getFacultyAuditLogs(
            @RequestParam(required = false) String query,
            @RequestParam(required = false) String facultyEmail,
            Authentication authentication) {

        String resolvedEmail = resolveFacultyEmail(facultyEmail, authentication);
        List<AuditLogDTO> logs = auditService.getFacultyAuditLogs(resolvedEmail, query);
        return ResponseEntity.ok(ApiResponse.success("Faculty activity logs fetched successfully", logs));
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
