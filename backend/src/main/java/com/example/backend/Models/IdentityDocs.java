package com.example.backend.Models;

import jakarta.persistence.*;
import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "student_identity_docs")
public class IdentityDocs {
    @Id
    private Long id;

    @OneToOne
    @MapsId
    @JoinColumn(name = "student_id")
    private StudentProfile studentProfile;

    private Boolean isAadharAvailable;
    @Column(unique = true)
    private String aadharNumber;
    private String nameAsPerAadhar;
    
    private String familyCardNumber;
    private Boolean isPanCardAvailable;
    private Boolean isPassportAvailable;
}
