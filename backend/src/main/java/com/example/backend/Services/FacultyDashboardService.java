package com.example.backend.Services;

import com.example.backend.DTOs.Faculty.FacultyDashboardStatsDTO;
import com.example.backend.DTOs.Faculty.FacultyStudentDTO;
import com.example.backend.Exceptions.ResourceNotFoundException;
import com.example.backend.Exceptions.UnauthorizedActionException;
import com.example.backend.Models.EligibilityCriteria;
import com.example.backend.Models.PlacementDrive;
import com.example.backend.Models.StudentProfile;
import com.example.backend.Models.User;
import com.example.backend.Models.enums.DriveStatus;
import com.example.backend.Models.enums.VerificationStatus;
import com.example.backend.Repositories.DriveApplicationRepository;
import com.example.backend.Repositories.PlacementDriveRepository;
import com.example.backend.Repositories.ProfileVerificationRepository;
import com.example.backend.Repositories.StudentProfileRepository;
import com.example.backend.Repositories.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.format.TextStyle;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class FacultyDashboardService {

    @Autowired
    private StudentProfileRepository studentProfileRepository;

    @Autowired
    private PlacementDriveRepository placementDriveRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private DriveApplicationRepository driveApplicationRepository;

    @Autowired
    private FacultyStudentService facultyStudentService;

    @Autowired
    private ProfileVerificationRepository profileVerificationRepository;

    @Autowired
    private PlacementEligibilityService placementEligibilityService;

    public FacultyDashboardStatsDTO getDepartmentStats(String facultyEmail) {
        User faculty = userRepository.findByEmail(facultyEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Faculty not found"));

        if (faculty.getDepartment() == null) {
            throw new UnauthorizedActionException("Faculty is not assigned to any department");
        }

        Long departmentId = faculty.getDepartment().getId();

        // Core Stats
        long totalStudents = studentProfileRepository.countByUserDepartmentId(departmentId);
        long verifiedStudents = studentProfileRepository.countByUserDepartmentIdAndVerificationStatus(
                departmentId, VerificationStatus.VERIFIED);
        long pendingVerifications = facultyStudentService.getDepartmentStudents(facultyEmail, "PENDING").size();
        long rejectedStudents = studentProfileRepository.countByUserDepartmentIdAndVerificationStatus(
                departmentId, VerificationStatus.REJECTED);
        long placedStudents = studentProfileRepository.countByUserDepartmentIdAndIsPlacedTrue(departmentId);
        long eligibleForDrives = studentProfileRepository.countByUserDepartmentIdAndIsEligibleForPlacementsTrue(departmentId);
        long activeApplications = driveApplicationRepository.findByStudentProfileUserDepartmentId(departmentId).size();

        long ongoingDrives = placementDriveRepository.countByAllowedDepartmentIdAndStatus(
                departmentId, DriveStatus.ONGOING);

        double placementPercentage = totalStudents > 0 ?
            Math.round(((double) placedStudents / totalStudents) * 100.0 * 100.0) / 100.0 : 0.0;

        // Verification Status Distribution
        FacultyDashboardStatsDTO.VerificationDistribution distribution =
            FacultyDashboardStatsDTO.VerificationDistribution.builder()
                .pending(pendingVerifications)
                .verified(verifiedStudents)
                .rejected(rejectedStudents)
                .build();

        // Monthly Verification Trend (Last 6 months)
        List<FacultyDashboardStatsDTO.MonthlyTrend> monthlyTrend = calculateMonthlyVerificationTrend(departmentId);

        // Drive Eligibility Breakdown
        List<FacultyDashboardStatsDTO.DriveEligibility> driveEligibility = calculateDriveEligibility(departmentId);

        return FacultyDashboardStatsDTO.builder()
                .totalDepartmentStudents(totalStudents)
                .pendingVerifications(pendingVerifications)
                .verifiedStudents(verifiedStudents)
                .eligibleForDrives(eligibleForDrives)
                .totalStudents(totalStudents) // backward compatibility
                .placedStudents(placedStudents)
                .placementPercentage(placementPercentage)
                .ongoingDrives(ongoingDrives)
                .activeApplications(activeApplications)
                .statusDistribution(distribution)
                .monthlyTrend(monthlyTrend)
                .driveEligibility(driveEligibility)
                .build();
    }

    private List<FacultyDashboardStatsDTO.MonthlyTrend> calculateMonthlyVerificationTrend(Long departmentId) {
        List<FacultyDashboardStatsDTO.MonthlyTrend> trends = new ArrayList<>();
        LocalDate now = LocalDate.now();

        for (int i = 5; i >= 0; i--) {
            LocalDate monthDate = now.minusMonths(i);
            String monthName = monthDate.getMonth().getDisplayName(TextStyle.SHORT, Locale.ENGLISH);

            long count = profileVerificationRepository.findByStudentProfileUserDepartmentId(departmentId)
                    .stream()
                    .filter(v -> v.getVerifiedAt() != null)
                    .filter(v -> v.getStatus() == VerificationStatus.VERIFIED)
                    .filter(v -> v.getVerifiedAt().getYear() == monthDate.getYear()
                            && v.getVerifiedAt().getMonthValue() == monthDate.getMonthValue())
                    .count();

            trends.add(FacultyDashboardStatsDTO.MonthlyTrend.builder()
                    .month(monthName)
                    .verified(count)
                    .build());
        }

        return trends;
    }

    private List<FacultyDashboardStatsDTO.DriveEligibility> calculateDriveEligibility(Long departmentId) {
        List<PlacementDrive> activeDrives = placementDriveRepository
                .findByStatusInAndAllowedDepartmentId(
                        Arrays.asList(DriveStatus.UPCOMING, DriveStatus.ONGOING),
                        departmentId);

        return activeDrives.stream()
                .map(drive -> {
                    // Count verified students who meet eligibility criteria
                    long eligibleCount = countEligibleStudents(departmentId, drive);

                    String driveTitle = drive.getTitle() != null ? drive.getTitle() : drive.getRole();

                    return FacultyDashboardStatsDTO.DriveEligibility.builder()
                            .driveName(driveTitle)
                            .eligibleCount(eligibleCount)
                            .build();
                })
                .collect(Collectors.toList());
    }

    private long countEligibleStudents(Long departmentId, PlacementDrive drive) {
        List<StudentProfile> verifiedStudents = studentProfileRepository
                .findByUserDepartmentIdAndVerificationStatus(departmentId, VerificationStatus.VERIFIED);

        return verifiedStudents.stream()
                .filter(student -> placementEligibilityService.evaluate(student, drive).isEligible())
                .count();
    }

    public List<FacultyStudentDTO> getPendingVerifications(String facultyEmail) {
        User faculty = userRepository.findByEmail(facultyEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Faculty not found"));

        if (faculty.getDepartment() == null) {
            throw new UnauthorizedActionException("Faculty is not assigned to any department");
        }

        return facultyStudentService.getDepartmentStudents(facultyEmail, "PENDING")
                .stream()
                .limit(10) // Return top 10 pending
                .collect(Collectors.toList());
    }

    public List<FacultyStudentDTO> getRecentVerifications(String facultyEmail) {
        User faculty = userRepository.findByEmail(facultyEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Faculty not found"));

        if (faculty.getDepartment() == null) {
            throw new UnauthorizedActionException("Faculty is not assigned to any department");
        }

        return facultyStudentService.getDepartmentStudents(facultyEmail, "VERIFIED")
                .stream()
                .limit(10) // Return top 10 recently verified
                .collect(Collectors.toList());
    }
}
