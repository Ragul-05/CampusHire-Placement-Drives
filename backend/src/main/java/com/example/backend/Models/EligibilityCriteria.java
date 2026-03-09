package com.example.backend.Models;

import jakarta.persistence.*;
import lombok.*;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "drive_eligibility")
public class EligibilityCriteria {
    @Id
    private Long driveId;

    @OneToOne
    @MapsId
    @JoinColumn(name = "drive_id")
    private PlacementDrive drive;

    private Double minCgpa;
    @Column(name = "min_x_marks")
    private Double minXMarks;

    @Column(name = "min_xii_marks")
    private Double minXiiMarks;
    private Integer maxStandingArrears;
    private Integer maxHistoryOfArrears;

    private Integer graduationYear;

    @ElementCollection
    @CollectionTable(name = "drive_required_skills", joinColumns = @JoinColumn(name = "drive_id"))
    @Column(name = "skill")
    private List<String> requiredSkills;

    @ManyToMany
    @JoinTable(name = "drive_allowed_departments", joinColumns = @JoinColumn(name = "drive_id"), inverseJoinColumns = @JoinColumn(name = "department_id"))
    private List<Department> allowedDepartments;
}
