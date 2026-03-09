package com.example.backend.Controllers;

import com.example.backend.DTOs.Admin.AuditLogDTO;
import com.example.backend.Services.AdminAuditService;
import com.example.backend.Utils.ApiResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/admin/audit")
public class AdminAuditController {

    @Autowired
    private AdminAuditService auditService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<AuditLogDTO>>> getAuditLogs(
            @RequestParam(required = false) String query) {
        List<AuditLogDTO> logs = auditService.getAuditLogs(query);
        return ResponseEntity.ok(ApiResponse.success("Audit logs fetched successfully", logs));
    }
}
