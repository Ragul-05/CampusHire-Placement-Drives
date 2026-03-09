package com.example.backend.Models;

import jakarta.persistence.*;
import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "student_coding_profiles")
public class CodingProfile {
    @Id
    private Long id;

    @OneToOne
    @MapsId
    @JoinColumn(name = "student_id")
    private StudentProfile studentProfile;

    private String leetcodeProfileUrl;
    private Integer leetcodeProblemsSolved;
    private String leetcodeRating;

    private String hackerrankProfileUrl;
    private String codechefProfileUrl;
    private String codeforcesProfileUrl;
    private String githubProfileUrl;
}
