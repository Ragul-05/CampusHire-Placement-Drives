package com.example.backend.Models;

import com.example.backend.Models.enums.ApplicationStage;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "drive_applications")
public class DriveApplication {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private StudentProfile studentProfile;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "drive_id", nullable = false)
    private PlacementDrive drive;

    @Enumerated(EnumType.STRING)
    private ApplicationStage stage;

    private LocalDateTime appliedAt;
    private LocalDateTime lastUpdatedAt;
    
    @Builder.Default
    private Boolean facultyApproved = false;

    @Builder.Default
    private Boolean submittedToAdmin = false;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "last_updated_by")
    private User lastUpdatedBy; // Faculty/Admin advancing the stage.
}
