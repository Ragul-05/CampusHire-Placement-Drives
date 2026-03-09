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
import com.example.backend.Models.enums.VerificationStatus;
import com.example.backend.Repositories.DriveApplicationRepository;
import com.example.backend.Repositories.PlacementDriveRepository;
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
        long pendingVerifications = studentProfileRepository.countByUserDepartmentIdAndVerificationStatus(
                departmentId, VerificationStatus.PENDING);
        long rejectedStudents = studentProfileRepository.countByUserDepartmentIdAndVerificationStatus(
                departmentId, VerificationStatus.REJECTED);
        long placedStudents = studentProfileRepository.countByUserDepartmentIdAndIsPlacedTrue(departmentId);
        long eligibleForDrives = studentProfileRepository.countByUserDepartmentIdAndIsEligibleForPlacementsTrue(departmentId);

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
                .activeApplications(0L)
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

            // For now, generate sample data
            // TODO: Implement actual database query to count verifications by month
            long count = (long) (Math.random() * 20 + 5);

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

        if (drive.getEligibilityCriteria() == null) {
            return 0;
        }

        EligibilityCriteria criteria = drive.getEligibilityCriteria();

        return verifiedStudents.stream()
                .filter(student -> {
                    if (student.getAcademicRecord() == null) return false;

                    // Check CGPA
                    if (student.getAcademicRecord().getCgpa() < criteria.getMinCgpa()) return false;

                    // Check standing arrears
                    if (student.getAcademicRecord().getStandingArrears() > criteria.getMaxStandingArrears()) return false;

                    // Check history of arrears
                    if (student.getAcademicRecord().getHistoryOfArrears() > criteria.getMaxHistoryOfArrears()) return false;

                    // Check graduation year
                    if (criteria.getGraduationYear() != null &&
                        !criteria.getGraduationYear().equals(student.getAcademicRecord().getUgYearOfPass())) return false;

                    // Check if student is eligible for placements
                    if (!Boolean.TRUE.equals(student.getIsEligibleForPlacements())) return false;

                    return true;
                })
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
