package com.example.backend.Models;

import jakarta.persistence.*;
import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "schooling_details")
public class SchoolingDetails {
    @Id
    private Long id;

    @OneToOne
    @MapsId
    @JoinColumn(name = "student_id")
    private StudentProfile studentProfile;

    // 10th
    @Column(name = "x_marks_percentage")
    private Double xMarksPercentage;
    @Column(name = "x_year_of_passing")
    private Integer xYearOfPassing;
    @Column(name = "x_school_name")
    private String xSchoolName;
    @Column(name = "x_board_of_study")
    private String xBoardOfStudy;

    // 12th
    @Column(name = "xii_marks_percentage")
    private Double xiiMarksPercentage;
    @Column(name = "xii_year_of_passing")
    private Integer xiiYearOfPassing;
    @Column(name = "xii_school_name")
    private String xiiSchoolName;
    @Column(name = "xii_board_of_study")
    private String xiiBoardOfStudy;
    @Column(name = "xii_cut_off_marks")
    private Double xiiCutOffMarks;

    // Diploma
    private Double diplomaMarksPercentage;
}
