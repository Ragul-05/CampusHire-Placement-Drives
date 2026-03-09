package com.example.backend.Models;

import jakarta.persistence.*;
import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "student_professional_profiles")
public class ProfessionalProfile {
    @Id
    private Long id;

    @OneToOne
    @MapsId
    @JoinColumn(name = "student_id")
    private StudentProfile studentProfile;
    
    // --- Networking ---
    private String linkedinProfileUrl;
    private String githubProfileUrl;
    private String portfolioUrl;

    // --- Competitive Programming Stats ---
    private String leetcodeProfileUrl;
    private Integer leetcodeProblemsSolved;
    private String leetcodeRating;

    private String hackerrankProfileUrl;
    private String codechefProfileUrl;
    private String codeforcesProfileUrl;
}
