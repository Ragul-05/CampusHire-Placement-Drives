package com.example.backend.Models;

import jakarta.persistence.*;
import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "student_contact_details")
public class ContactDetails {
    @Id
    private Long id;

    @OneToOne
    @MapsId
    @JoinColumn(name = "student_id")
    private StudentProfile studentProfile;

    private String alternateEmail;
    private String studentMobile1;
    private String studentMobile2;
    private String parentMobile;
    private String landlineNo;

    @Column(length = 500)
    private String fullAddress;
    private String city;
    private String state;
    private String pincode;
}
