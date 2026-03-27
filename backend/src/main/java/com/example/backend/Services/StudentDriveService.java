package com.example.backend.Services;

import com.example.backend.DTOs.PlacementDriveDto;
import com.example.backend.Exceptions.ResourceNotFoundException;
import com.example.backend.Mappers.PlacementMapper;
import com.example.backend.Models.DriveApplication;
import com.example.backend.Models.PlacementDrive;
import com.example.backend.Models.StudentProfile;
import com.example.backend.Models.enums.DriveStatus;
import com.example.backend.Repositories.DriveApplicationRepository;
import com.example.backend.Repositories.PlacementDriveRepository;
import com.example.backend.Repositories.StudentProfileRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class StudentDriveService {

    @Autowired private PlacementDriveRepository placementDriveRepository;
    @Autowired private StudentProfileRepository studentProfileRepository;
    @Autowired private DriveApplicationRepository driveApplicationRepository;
    @Autowired private PlacementEligibilityService placementEligibilityService;

    @Transactional(readOnly = true)
    public List<PlacementDriveDto> getVisibleDrives(String email) {
        StudentProfile profile = studentProfileRepository.findByUserEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Profile not found"));

        List<PlacementDrive> drives = placementDriveRepository
                .findByStatusIn(List.of(DriveStatus.ONGOING, DriveStatus.UPCOMING));

        Map<Long, DriveApplication> appliedMap = driveApplicationRepository
                .findByStudentProfileId(profile.getId())
                .stream()
                .collect(Collectors.toMap(a -> a.getDrive().getId(), a -> a, (a, b) -> a));

        return drives.stream().map(drive -> {
            PlacementEligibilityService.EligibilityEvaluation evaluation =
                    placementEligibilityService.evaluate(profile, drive);

            DriveApplication application = appliedMap.get(drive.getId());
            boolean hasApplied = application != null;
            String applicationStage = hasApplied && application.getStage() != null
                    ? application.getStage().name()
                    : null;

            return PlacementMapper.toDriveDto(
                    drive,
                    evaluation.isEligible(),
                    evaluation.getPrimaryReason(),
                    hasApplied,
                    applicationStage
            );
        }).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<PlacementDriveDto> getEligibleDrives(String email) {
        return getVisibleDrives(email).stream()
                .filter(drive -> Boolean.TRUE.equals(drive.getIsEligible()))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public PlacementDriveDto getDriveDetails(String email, Long driveId) {
        return getVisibleDrives(email).stream()
                .filter(d -> d.getId().equals(driveId))
                .findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("Drive not found or not visible"));
    }
}
