package com.example.backend.Services;

import com.example.backend.DTOs.Admin.AuditLogDTO;
import com.example.backend.Models.AuditLog;
import com.example.backend.Repositories.AuditLogRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class AdminAuditService {

    @Autowired
    private AuditLogRepository auditLogRepository;

    public List<AuditLogDTO> getAuditLogs(String query) {
        List<AuditLog> logs;
        if (query != null && !query.trim().isEmpty()) {
            logs = auditLogRepository.findByActionContainingIgnoreCaseOrTargetEntityContainingIgnoreCase(query, query);
        } else {
            logs = auditLogRepository.findAll(Sort.by(Sort.Direction.DESC, "timestamp"));
        }
        return logs.stream().map(this::mapToDTO).collect(Collectors.toList());
    }

    public List<AuditLogDTO> getFacultyAuditLogs(String facultyEmail, String query) {
        List<AuditLog> logs;
        if (query != null && !query.trim().isEmpty()) {
            logs = auditLogRepository.findFacultyAuditLogsByQuery(facultyEmail, query);
        } else {
            logs = auditLogRepository.findByActorEmailOrderByTimestampDesc(facultyEmail);
        }
        return logs.stream().map(this::mapToDTO).collect(Collectors.toList());
    }

    private AuditLogDTO mapToDTO(AuditLog log) {
        return AuditLogDTO.builder()
                .id(log.getId())
                .adminEmail(log.getActor() != null ? log.getActor().getEmail() : "System")
                .action(log.getAction())
                .targetEntity(log.getTargetEntity())
                .targetEntityId(log.getTargetEntityId() != null ? String.valueOf(log.getTargetEntityId()) : null)
                .details(log.getDetails())
                .timestamp(log.getTimestamp())
                .ipAddress(log.getIpAddress())
                .build();
    }
}
