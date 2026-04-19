package com.example.backend.Services;

import com.example.backend.Models.DriveApplication;
import com.example.backend.Models.PlacementDrive;
import com.example.backend.Models.StudentProfile;
import com.example.backend.Models.enums.ApplicationStage;
import com.example.backend.Models.enums.DriveStatus;
import com.example.backend.Models.enums.VerificationStatus;
import com.example.backend.Repositories.DriveApplicationRepository;
import com.example.backend.Repositories.PlacementDriveRepository;
import com.example.backend.Repositories.StudentProfileRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
public class DriveEligibilitySyncService {

    @Autowired
    private StudentProfileRepository studentProfileRepository;

    @Autowired
    private PlacementDriveRepository placementDriveRepository;

    @Autowired
    private DriveApplicationRepository driveApplicationRepository;

    @Autowired
    private PlacementEligibilityService placementEligibilityService;

    @Transactional
    public void syncEligibleMappingsForStudent(StudentProfile profile) {
        if (profile == null || profile.getId() == null) {
            return;
        }

        List<PlacementDrive> drives = placementDriveRepository.findAll();
        drives.forEach(drive -> syncSingleMapping(profile, drive));
    }

    @Transactional
    public void syncEligibleMappingsForDrive(PlacementDrive drive) {
        if (drive == null || drive.getId() == null) {
            return;
        }

        List<StudentProfile> verifiedStudents = studentProfileRepository.findByVerificationStatus(VerificationStatus.VERIFIED);
        verifiedStudents.forEach(profile -> syncSingleMapping(profile, drive));
    }

    @Transactional
    public void syncEligibleMappingsForDriveId(Long driveId) {
        PlacementDrive drive = placementDriveRepository.findById(driveId).orElse(null);
        if (drive != null) {
            syncEligibleMappingsForDrive(drive);
        }
    }

    @Transactional(readOnly = true)
    public List<DriveApplication> getStudentMappings(Long studentProfileId) {
        return driveApplicationRepository.findByStudentProfileId(studentProfileId);
    }

    private void syncSingleMapping(StudentProfile profile, PlacementDrive drive) {
        List<DriveApplication> existingRecords = driveApplicationRepository
                .findByStudentProfileIdAndDriveIdOrderByIdAsc(profile.getId(), drive.getId());

        DriveApplication existing = existingRecords.isEmpty() ? null : existingRecords.get(0);

        // Clean duplicate mappings defensively; keep the oldest canonical one.
        if (existingRecords.size() > 1) {
            for (int i = 1; i < existingRecords.size(); i++) {
                driveApplicationRepository.delete(existingRecords.get(i));
            }
        }

        // Locked profiles must not attend/apply to additional drives.
        // Clean up only auto-eligible placeholders while preserving progressed records.
        if (Boolean.TRUE.equals(profile.getIsLocked())) {
            if (existing != null && existing.getStage() == ApplicationStage.ELIGIBLE) {
                driveApplicationRepository.delete(existing);
            }
            return;
        }

        if (drive.getStatus() == DriveStatus.COMPLETED) {
            return;
        }

        boolean eligible = placementEligibilityService.evaluate(profile, drive).isEligible();

        if (eligible) {
            if (existing != null) {
                if (existing.getStage() == null) {
                    existing.setStage(ApplicationStage.ELIGIBLE);
                }
                if (existing.getAppliedAt() == null) {
                    existing.setAppliedAt(LocalDateTime.now());
                }
                if (existing.getLastUpdatedAt() == null) {
                    existing.setLastUpdatedAt(LocalDateTime.now());
                }
                driveApplicationRepository.save(existing);
            } else {
                driveApplicationRepository.save(DriveApplication.builder()
                        .studentProfile(profile)
                        .drive(drive)
                        .stage(ApplicationStage.ELIGIBLE)
                        .appliedAt(LocalDateTime.now())
                        .lastUpdatedAt(LocalDateTime.now())
                        .facultyApproved(false)
                        .submittedToAdmin(false)
                        .build());
            }
            return;
        }

        if (existing != null && existing.getStage() == ApplicationStage.ELIGIBLE) {
            driveApplicationRepository.delete(existing);
        }
    }
}
