package com.example.backend.Models;

import jakarta.persistence.*;
import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "academic_records")
public class AcademicRecord {
    @Id
    private Long id;

    @OneToOne
    @MapsId
    @JoinColumn(name = "student_id")
    private StudentProfile studentProfile;

    private Integer ugYearOfPass;
    private String admissionQuota; // Management / Government
    private String mediumOfInstruction;
    private String locality; // Rural / Urban

    // Semesters
    private Double sem1Gpa;
    private Double sem2Gpa;
    private Double sem3Gpa;
    private Double sem4Gpa;
    private Double sem5Gpa;
    private Double sem6Gpa;
    private Double sem7Gpa;
    private Double sem8Gpa;
    
    @Column(nullable = true)
    private Double cgpa; // Heavily Indexed for Eligibility Engine

    // Arrears
    private Integer standingArrears;
    private Integer historyOfArrears;
    private Boolean hasHistoryOfArrears; 
    private Integer courseGapInYears;
}
