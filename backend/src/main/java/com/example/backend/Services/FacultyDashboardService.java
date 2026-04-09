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
import com.example.backend.Repositories.OfferRepository;
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

        @Autowired
        private OfferRepository offerRepository;

    public FacultyDashboardStatsDTO getDepartmentStats(String facultyEmail) {
        User faculty = userRepository.findByEmail(facultyEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Faculty not found"));

        if (faculty.getDepartment() == null) {
            throw new UnauthorizedActionException("Faculty is not assigned to any department");
        }

        Long departmentId = faculty.getDepartment().getId();
        List<StudentProfile> visibleStudents = studentProfileRepository.findAll();

        long totalStudents = visibleStudents.size();
        long verifiedStudents = visibleStudents.stream()
                .filter(student -> student.getVerificationStatus() == VerificationStatus.VERIFIED)
                .count();
        long pendingVerifications = visibleStudents.stream()
                .filter(student -> student.getVerificationStatus() == null
                        || student.getVerificationStatus() == VerificationStatus.PENDING)
                .count();
        long rejectedStudents = visibleStudents.stream()
                .filter(student -> student.getVerificationStatus() == VerificationStatus.REJECTED)
                .count();
        long placedStudents = visibleStudents.stream()
                .filter(student -> Boolean.TRUE.equals(student.getIsPlaced()))
                .count();
        long totalOffers = offerRepository.countByStudentProfileUserDepartmentId(departmentId);
        long eligibleForDrives = visibleStudents.stream()
                .filter(student -> Boolean.TRUE.equals(student.getIsEligibleForPlacements()))
                .count();
        long activeApplications = driveApplicationRepository.findAll().size();

        long ongoingDrives = placementDriveRepository.findAll().stream()
                .filter(drive -> drive.getStatus() == DriveStatus.ONGOING)
                .count();

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
                .totalOffers(totalOffers)
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
        List<com.example.backend.Models.Offer> deptOffers = offerRepository
                .findByStudentProfileUserDepartmentIdOrderByIssuedAtDesc(departmentId);

        for (int i = 5; i >= 0; i--) {
            LocalDate monthDate = now.minusMonths(i);
            String monthName = monthDate.getMonth().getDisplayName(TextStyle.SHORT, Locale.ENGLISH);

            long count = deptOffers.stream()
                    .filter(v -> v.getIssuedAt() != null)
                    .filter(v -> v.getIssuedAt().getYear() == monthDate.getYear()
                            && v.getIssuedAt().getMonthValue() == monthDate.getMonthValue())
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
                .findAll()
                .stream()
                .filter(drive -> Arrays.asList(DriveStatus.UPCOMING, DriveStatus.ONGOING).contains(drive.getStatus()))
                .collect(Collectors.toList());

        return activeDrives.stream()
                .map(drive -> {
                    // Count verified students who meet eligibility criteria
                    long eligibleCount = countEligibleStudents(drive);

                    String driveTitle = drive.getTitle() != null ? drive.getTitle() : drive.getRole();

                    return FacultyDashboardStatsDTO.DriveEligibility.builder()
                            .driveName(driveTitle)
                            .eligibleCount(eligibleCount)
                            .build();
                })
                .collect(Collectors.toList());
    }

    private long countEligibleStudents(PlacementDrive drive) {
        List<StudentProfile> verifiedStudents = studentProfileRepository
                .findByVerificationStatus(VerificationStatus.VERIFIED);

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
