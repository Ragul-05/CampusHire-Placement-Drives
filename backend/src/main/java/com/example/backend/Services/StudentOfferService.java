package com.example.backend.Services;

import com.example.backend.DTOs.StudentOfferDTO;
import com.example.backend.Exceptions.ResourceNotFoundException;
import com.example.backend.Models.Offer;
import com.example.backend.Models.StudentProfile;
import com.example.backend.Repositories.OfferRepository;
import com.example.backend.Repositories.StudentProfileRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class StudentOfferService {

    @Autowired
    private StudentProfileRepository studentProfileRepository;

    @Autowired
    private OfferRepository offerRepository;

    public List<StudentOfferDTO> getMyOffers(String email) {
        StudentProfile student = studentProfileRepository.findByUserEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Student profile not found for email: " + email));

        return offerRepository.findByStudentProfileId(student.getId())
                .stream()
                .map(offer -> mapToDTO(offer, student))
                .collect(Collectors.toList());
    }

    private StudentOfferDTO mapToDTO(Offer offer, StudentProfile student) {
        String companyName = null;
        String companyIndustry = null;
        String driveTitle = null;
        if (offer.getDrive() != null) {
            driveTitle = offer.getDrive().getTitle();
            if (offer.getDrive().getCompany() != null) {
                companyName = offer.getDrive().getCompany().getName();
                companyIndustry = offer.getDrive().getCompany().getIndustry();
            }
        }

        return StudentOfferDTO.builder()
                .id(offer.getId())
                .driveId(offer.getDrive() != null ? offer.getDrive().getId() : null)
                .driveTitle(driveTitle)
                .companyName(companyName)
                .companyIndustry(companyIndustry)
                .role(offer.getRole())
                .ctcLpa(offer.getCtc())
                .issuedAt(offer.getIssuedAt())
                .status("OFFERED")
                .isPlaced(student.getIsPlaced())
                .isLocked(student.getIsLocked())
                .numberOfOffers(student.getNumberOfOffers())
                .highestPackageLpa(student.getHighestPackageLpa())
                .build();
    }
}
