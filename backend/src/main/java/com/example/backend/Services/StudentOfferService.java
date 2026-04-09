package com.example.backend.Services;

import com.example.backend.DTOs.StudentOfferDTO;
import com.example.backend.Exceptions.ResourceNotFoundException;
import com.example.backend.Models.Offer;
import com.example.backend.Models.StudentProfile;
import com.example.backend.Repositories.OfferRepository;
import com.example.backend.Repositories.StudentProfileRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class StudentOfferService {

    @Autowired
    private StudentProfileRepository studentProfileRepository;

    @Autowired
    private OfferRepository offerRepository;

    @Transactional
    public void acceptOffer(String email, Long offerId) {
        StudentProfile student = studentProfileRepository.findByUserEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Student profile not found for email: " + email));

        Offer offer = offerRepository.findByIdAndStudentProfileId(offerId, student.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Offer not found for this student"));

        String acceptedCompany = offer.getDrive() != null && offer.getDrive().getCompany() != null
                ? offer.getDrive().getCompany().getName()
                : "Offer-" + offer.getId();

        student.setOptedOffer(acceptedCompany);
        student.setIsPlaced(true);
        student.setIsLocked(true);

        if (offer.getCtc() != null) {
            double currentHighest = student.getHighestPackageLpa() != null ? student.getHighestPackageLpa() : 0.0;
            if (offer.getCtc() > currentHighest) {
                student.setHighestPackageLpa(offer.getCtc());
            }
        }

        Integer totalOffers = student.getNumberOfOffers();
        if (totalOffers == null || totalOffers == 0) {
            student.setNumberOfOffers(offerRepository.findByStudentProfileId(student.getId()).size());
        }

        studentProfileRepository.save(student);
    }

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
                .status(Boolean.TRUE.equals(student.getIsLocked())
                    && student.getOptedOffer() != null
                    && student.getOptedOffer().equalsIgnoreCase(companyName != null ? companyName : "")
                    ? "ACCEPTED"
                    : "OFFERED")
                .accepted(Boolean.TRUE.equals(student.getIsLocked())
                    && student.getOptedOffer() != null
                    && student.getOptedOffer().equalsIgnoreCase(companyName != null ? companyName : ""))
                .isPlaced(student.getIsPlaced())
                .isLocked(student.getIsLocked())
                .numberOfOffers(student.getNumberOfOffers())
                .highestPackageLpa(student.getHighestPackageLpa())
                .build();
    }
}
