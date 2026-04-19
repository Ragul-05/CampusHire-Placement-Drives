package com.example.backend.Services;

import com.example.backend.DTOs.DriveApplicationDto;
import com.example.backend.DTOs.PlacementDriveDto;
import com.example.backend.Exceptions.ResourceNotFoundException;
import com.example.backend.Mappers.PlacementMapper;
import com.example.backend.Models.DriveApplication;
import com.example.backend.Models.StudentProfile;
import com.example.backend.Repositories.DriveApplicationRepository;
import com.example.backend.Repositories.StudentProfileRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class DriveApplicationService {

    private static final Logger logger = LoggerFactory.getLogger(DriveApplicationService.class);

    @Autowired
    private DriveApplicationRepository applicationRepository;

    @Autowired
    private StudentProfileRepository profileRepository;

    @Autowired
    private DriveEligibilitySyncService driveEligibilitySyncService;

    public void applyForDrive(String email, Long driveId) {
        throw new IllegalArgumentException("Manual drive application is disabled. Students are mapped automatically based on eligibility.");
    }

    public List<DriveApplicationDto> getMyApplications(String email) {
        StudentProfile profile = profileRepository.findByUserEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Profile not found"));

        try {
            driveEligibilitySyncService.syncEligibleMappingsForStudent(profile);
        } catch (RuntimeException ex) {
            logger.warn("Eligibility sync failed for studentProfileId={}. Returning existing applications only. Cause: {}",
                    profile.getId(), ex.getMessage());
        }

        List<DriveApplication> applications = applicationRepository.findByStudentProfileId(profile.getId());

        return applications.stream()
                .map(PlacementMapper::toAppDto)
                .collect(Collectors.toList());
    }
}
