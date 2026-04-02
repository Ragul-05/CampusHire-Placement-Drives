package com.example.backend.Services;

import com.example.backend.DTOs.PlacementDriveDto;
import com.example.backend.Repositories.CompanyRepository;
import com.example.backend.Repositories.DriveApplicationRepository;
import com.example.backend.Repositories.PlacementDriveRepository;
import com.example.backend.Repositories.StudentProfileRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class StudentDashboardService {

    @Autowired
    private StudentProfileRepository studentProfileRepository;

    @Autowired
    private PlacementDriveRepository driveRepository;

    @Autowired
    private CompanyRepository companyRepository;

    @Autowired
    private StudentDriveService studentDriveService;

    @Autowired
    private DriveApplicationRepository driveApplicationRepository;

    @Autowired
    private DriveEligibilitySyncService driveEligibilitySyncService;

    public Map<String, Object> getDashboardStats(String email) {
        Map<String, Object> stats = new HashMap<>();

        com.example.backend.Models.StudentProfile profile = studentProfileRepository.findByUserEmail(email)
                .orElseThrow(() -> new com.example.backend.Exceptions.ResourceNotFoundException("Student not found"));

        driveEligibilitySyncService.syncEligibleMappingsForStudent(profile);

        long totalDrives = driveRepository.countByStatusIn(
                java.util.List.of(com.example.backend.Models.enums.DriveStatus.ONGOING, 
                                 com.example.backend.Models.enums.DriveStatus.UPCOMING));

        long ongoingDrives = driveRepository.countByStatus(com.example.backend.Models.enums.DriveStatus.ONGOING);

        // Get visible drives and count eligible ones
        List<PlacementDriveDto> visibleDrives = studentDriveService.getVisibleDrives(email);
        long eligibleDrives = visibleDrives.stream().filter(d -> Boolean.TRUE.equals(d.getIsEligible())).count();

        long appliedDrives = driveApplicationRepository.findByStudentProfileId(profile.getId()).size();

        long totalPlaced = studentProfileRepository.countByIsPlacedTrue();
        long totalCompanies = companyRepository.count();
        Double highestCtc = driveRepository.findTopByOrderByCtcLpaDesc()
                .map(com.example.backend.Models.PlacementDrive::getCtcLpa)
                .orElse(0.0);

        stats.put("totalDrives", totalDrives);
        stats.put("ongoingDrives", ongoingDrives);
        stats.put("eligibleDrives", eligibleDrives);
        stats.put("appliedDrives", appliedDrives);
        stats.put("totalPlaced", totalPlaced);
        stats.put("totalCompanies", totalCompanies);
        stats.put("highestCtcLpa", highestCtc);
        stats.put("verificationStatus", profile.getVerificationStatus() != null ? profile.getVerificationStatus().name() : "PENDING");
        stats.put("isEligibleForPlacements", profile.getIsEligibleForPlacements());
        stats.put("eligibleForAdminReview", profile.getEligibleForAdminReview());

        return stats;
    }
}
