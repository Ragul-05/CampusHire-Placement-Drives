package com.example.backend.Models;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "student_personal_details")
public class PersonalDetails {
    @Id
    private Long id; // MapsId to StudentProfile

    @OneToOne
    @MapsId
    @JoinColumn(name = "student_id")
    private StudentProfile studentProfile;

    private String firstName;
    private String lastName;
    private String fatherName;
    private String motherName;
    private String fatherOccupation;
    private String motherOccupation;
    private String gender;
    private String community; 
    private LocalDate dateOfBirth;
    private String hostelerOrDayScholar;

    @Column(columnDefinition = "TEXT")
    private String bio;
}
