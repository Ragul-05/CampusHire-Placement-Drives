package com.example.backend.Services;

import com.example.backend.Exceptions.ResourceNotFoundException;
import com.example.backend.Exceptions.UnauthorizedActionException;
import com.example.backend.Models.DriveApplication;
import com.example.backend.Models.Offer;
import com.example.backend.Models.StudentProfile;
import com.example.backend.Models.User;
import com.example.backend.Models.enums.ApplicationStage;
import com.example.backend.Models.enums.Role;
import com.example.backend.Repositories.DriveApplicationRepository;
import com.example.backend.Repositories.OfferRepository;
import com.example.backend.Repositories.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
public class StageUpdateService {

    @Autowired
    private DriveApplicationRepository driveApplicationRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private OfferRepository offerRepository;

    @Transactional
    public void updateStage(Long studentId, Long driveId, ApplicationStage targetStage, String actorEmail) {
        User actor = userRepository.findByEmail(actorEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (actor.getRole() == Role.STUDENT) {
            throw new UnauthorizedActionException("Students are not allowed to update application stages.");
        }

        DriveApplication application = driveApplicationRepository
                .findByStudentProfileIdAndDriveId(studentId, driveId)
                .orElseThrow(() -> new ResourceNotFoundException("Application not found for this student and drive"));

        if (actor.getRole() == Role.FACULTY && targetStage == ApplicationStage.SELECTED) {
            throw new UnauthorizedActionException("Faculty can update stages only up to HR.");
        }

        if (actor.getRole() == Role.FACULTY && !Boolean.TRUE.equals(application.getFacultyApproved())) {
            throw new UnauthorizedActionException("Faculty can only move forward students who are faculty-approved.");
        }

        application.setStage(targetStage);
        application.setLastUpdatedAt(LocalDateTime.now());
        application.setLastUpdatedBy(actor);

        if (targetStage == ApplicationStage.SELECTED) {
            application.setSubmittedToAdmin(true);
            autoCreateOfferAndLockStudent(application);
        }

        driveApplicationRepository.save(application);
    }

    private void autoCreateOfferAndLockStudent(DriveApplication application) {
        Long driveId = application.getDrive().getId();
        Long studentId = application.getStudentProfile().getId();

        boolean offerExists = offerRepository.findByDriveIdAndStudentProfileId(driveId, studentId).isPresent();
        if (!offerExists) {
            Offer offer = Offer.builder()
                    .studentProfile(application.getStudentProfile())
                    .drive(application.getDrive())
                    .ctc(application.getDrive().getCtcLpa())
                    .role(application.getDrive().getRole())
                    .issuedAt(LocalDateTime.now())
                    .build();
            offerRepository.save(offer);
        }

        StudentProfile student = application.getStudentProfile();
        student.setIsPlaced(true);
        int currentOffers = student.getNumberOfOffers() != null ? student.getNumberOfOffers() : 0;
        if (!offerExists) {
            student.setNumberOfOffers(currentOffers + 1);
        }

        double currentMax = student.getHighestPackageLpa() != null ? student.getHighestPackageLpa() : 0.0;
        double currentCtc = application.getDrive().getCtcLpa() != null ? application.getDrive().getCtcLpa() : 0.0;
        if (currentCtc > currentMax) {
            student.setHighestPackageLpa(currentCtc);
        }
    }
}
