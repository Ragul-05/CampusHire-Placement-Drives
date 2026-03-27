package com.example.backend.Models;

import com.example.backend.Models.enums.VerificationStatus;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "student_profiles")
public class StudentProfile {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY, cascade = CascadeType.ALL)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    private String rollNo;
    private String batch; // e.g., "2022-2026"

    // ── Resume ──────────────────────────────────────────
    private String resumeUrl;
    private String resumeFileName;
    private LocalDateTime resumeUploadedAt;

    @Column(columnDefinition = "TEXT")
    private String resumeSummary;   // Career objective / summary from resume

    // ── Status ──────────────────────────────────────────
    @Enumerated(EnumType.STRING)
    private VerificationStatus verificationStatus;

    @Builder.Default
    private Boolean submittedForVerification = false;

    private Boolean isLocked;
    private Boolean isEligibleForPlacements;
    private Boolean interestedOnPlacement;
    // When faculty marks a verified student for admin review
    @Builder.Default
    private Boolean eligibleForAdminReview = false;

    // ── Placement result ────────────────────────────────
    private Boolean isPlaced;
    private Integer numberOfOffers;
    private String offer1;
    private String offer2;
    private String offer3;
    private String offer4;
    private String optedOffer;
    private Double highestPackageLpa;

    // ── Sub-entities ─────────────────────────────────────
    @OneToOne(mappedBy = "studentProfile", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private PersonalDetails personalDetails;

    @OneToOne(mappedBy = "studentProfile", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private ContactDetails contactDetails;

    @OneToOne(mappedBy = "studentProfile", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private IdentityDocs identityDocs;

    @OneToOne(mappedBy = "studentProfile", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private AcademicRecord academicRecord;

    @OneToOne(mappedBy = "studentProfile", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private SchoolingDetails schoolingDetails;

    @OneToOne(mappedBy = "studentProfile", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private ProfessionalProfile professionalProfile;

    @OneToMany(mappedBy = "studentProfile", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<Certification> certifications = new ArrayList<>();

    @OneToMany(mappedBy = "studentProfile", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<StudentSkill> skills = new ArrayList<>();

    @OneToOne(mappedBy = "studentProfile", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private CodingProfile codingProfile;
}
