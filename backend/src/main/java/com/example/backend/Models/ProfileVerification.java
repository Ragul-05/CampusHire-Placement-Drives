package com.example.backend.Models;

import com.example.backend.Models.enums.VerificationStatus;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "profile_verifications")
public class ProfileVerification {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_profile_id", nullable = false)
    private StudentProfile studentProfile;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "faculty_id", nullable = false) // The faculty who verified it
    private User faculty;

    @Enumerated(EnumType.STRING)
    private VerificationStatus status; // PENDING, VERIFIED, REJECTED

    @Column(length = 1000)
    private String remarks; // Reason for rejection, e.g., "10th Marksheet blurry"

    private LocalDateTime verifiedAt;
}
