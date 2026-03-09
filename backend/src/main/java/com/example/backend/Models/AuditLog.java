package com.example.backend.Models;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "audit_logs")
public class AuditLog {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User actor; // Admin or Faculty who executed the action

    private String action; // e.g., "CREATE_DRIVE", "LOCK_PROFILE", "DELETE_COMPANY"
    private String targetEntity; // e.g., "PlacementDrive", "StudentProfile"
    private Long targetEntityId; // e.g., 52

    @Column(columnDefinition = "TEXT")
    private String details; // Snapshot of change in JSON format

    private LocalDateTime timestamp;
    private String ipAddress;
}
