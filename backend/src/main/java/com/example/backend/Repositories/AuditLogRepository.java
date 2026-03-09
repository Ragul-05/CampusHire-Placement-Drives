package com.example.backend.Repositories;

import com.example.backend.Models.AuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {
    java.util.List<AuditLog> findByActionContainingIgnoreCaseOrTargetEntityContainingIgnoreCase(String action,
            String targetEntity);
}
