package com.example.backend.Services;

import com.example.backend.DTOs.Admin.OfferRequestDTO;
import com.example.backend.DTOs.Admin.OfferResponseDTO;
import com.example.backend.Exceptions.InvalidDriveStateException;
import com.example.backend.Exceptions.ResourceNotFoundException;
import com.example.backend.Models.DriveApplication;
import com.example.backend.Models.Offer;
import com.example.backend.Models.PlacementDrive;
import com.example.backend.Models.StudentProfile;
import com.example.backend.Models.enums.ApplicationStage;
import com.example.backend.Models.enums.DriveStatus;
import com.example.backend.Repositories.DriveApplicationRepository;
import com.example.backend.Repositories.OfferRepository;
import com.example.backend.Repositories.PlacementDriveRepository;
import com.example.backend.Repositories.StudentProfileRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class AdminFinalPlacementService {

    @Autowired
    private PlacementDriveRepository driveRepository;

    @Autowired
    private StudentProfileRepository studentRepository;

    @Autowired
    private DriveApplicationRepository applicationRepository;

    @Autowired
    private OfferRepository offerRepository;

    @Transactional
    public OfferResponseDTO recordOffer(Long driveId, OfferRequestDTO request) {
        PlacementDrive drive = driveRepository.findById(driveId)
                .orElseThrow(() -> new ResourceNotFoundException("Drive not found"));

        if (drive.getStatus() == DriveStatus.COMPLETED) {
            throw new InvalidDriveStateException("Cannot add offers to a completed drive");
        }

        StudentProfile student = studentRepository.findById(request.getStudentId())
                .orElseThrow(() -> new ResourceNotFoundException("Student not found"));

        // Update application stage if exists
        List<DriveApplication> apps = applicationRepository.findByStudentProfileId(student.getId());
        for (DriveApplication app : apps) {
            if (app.getDrive().getId().equals(driveId)) {
                app.setStage(ApplicationStage.SELECTED);
                app.setSubmittedToAdmin(true);
                applicationRepository.save(app);
            }
        }

        // Create Offer
        Offer offer = Offer.builder()
                .studentProfile(student)
                .drive(drive)
                .ctc(request.getCtc())
                .role(request.getRole())
                .issuedAt(LocalDateTime.now())
                .build();
        offer = offerRepository.save(offer);

        // Update Student Profile
        student.setIsPlaced(true);
        int currentOffers = student.getNumberOfOffers() != null ? student.getNumberOfOffers() : 0;
        student.setNumberOfOffers(currentOffers + 1);
        double currentMax = student.getHighestPackageLpa() != null ? student.getHighestPackageLpa() : 0.0;
        if (request.getCtc() != null && request.getCtc() > currentMax) {
            student.setHighestPackageLpa(request.getCtc());
        }
        studentRepository.save(student);

        return mapToDTO(offer);
    }

    public PlacementDrive markDriveCompleted(Long driveId) {
        PlacementDrive drive = driveRepository.findById(driveId)
                .orElseThrow(() -> new ResourceNotFoundException("Drive not found"));
        drive.setStatus(DriveStatus.COMPLETED);
        return driveRepository.save(drive);
    }

    public List<OfferResponseDTO> getOffersByDrive(Long driveId) {
        return offerRepository.findByDriveId(driveId).stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    public List<OfferResponseDTO> getAllOffers() {
        return offerRepository.findAllByOrderByIssuedAtDesc().stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    private OfferResponseDTO mapToDTO(Offer offer) {
        String studentName = offer.getStudentProfile().getUser() != null
            ? offer.getStudentProfile().getUser().getEmail()
            : "N/A";
        if (offer.getStudentProfile().getPersonalDetails() != null
            && offer.getStudentProfile().getPersonalDetails().getFirstName() != null
            && !offer.getStudentProfile().getPersonalDetails().getFirstName().isBlank()) {
            String firstName = offer.getStudentProfile().getPersonalDetails().getFirstName().trim();
            String lastName = offer.getStudentProfile().getPersonalDetails().getLastName() != null
                ? offer.getStudentProfile().getPersonalDetails().getLastName().trim()
                : "";
            studentName = (firstName + " " + lastName).trim();
        }

        return OfferResponseDTO.builder()
                .id(offer.getId())
                .studentId(offer.getStudentProfile().getId())
            .studentName(studentName)
                .studentEmail(
                        offer.getStudentProfile().getUser() != null ? offer.getStudentProfile().getUser().getEmail()
                                : "N/A")
                .driveId(offer.getDrive().getId())
            .driveTitle(offer.getDrive().getTitle())
            .companyName(offer.getDrive().getCompany() != null ? offer.getDrive().getCompany().getName() : "N/A")
                .ctc(offer.getCtc())
                .role(offer.getRole())
                .issuedAt(offer.getIssuedAt())
                .build();
    }
}
