package com.example.backend.Repositories;

import com.example.backend.Models.AuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {
    java.util.List<AuditLog> findByActionContainingIgnoreCaseOrTargetEntityContainingIgnoreCase(String action,
            String targetEntity);

        java.util.List<AuditLog> findByActorEmailOrderByTimestampDesc(String actorEmail);

        @Query("""
                        SELECT a FROM AuditLog a
                        WHERE LOWER(a.actor.email) = LOWER(:actorEmail)
                            AND (
                                LOWER(a.action) LIKE LOWER(CONCAT('%', :query, '%'))
                                OR LOWER(a.targetEntity) LIKE LOWER(CONCAT('%', :query, '%'))
                            )
                        ORDER BY a.timestamp DESC
                        """)
        java.util.List<AuditLog> findFacultyAuditLogsByQuery(
                        @Param("actorEmail") String actorEmail,
                        @Param("query") String query);
}
