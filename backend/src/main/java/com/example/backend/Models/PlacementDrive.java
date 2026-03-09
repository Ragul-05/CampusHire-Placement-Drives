package com.example.backend.Models;

import com.example.backend.Models.enums.DriveStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "placement_drives")
public class PlacementDrive {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id", nullable = false)
    private Company company;

    private String title;
    private String role;
    private Double ctcLpa;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    private DriveStatus status; // UPCOMING, ONGOING, COMPLETED

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    private LocalDateTime applicationDeadline;
    private Integer totalOpenings;

    @OneToOne(mappedBy = "drive", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private EligibilityCriteria eligibilityCriteria;
}
