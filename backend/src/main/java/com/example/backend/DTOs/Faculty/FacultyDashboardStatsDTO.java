package com.example.backend.DTOs.Faculty;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class FacultyDashboardStatsDTO {
    private Long totalDepartmentStudents;
    private Long pendingVerifications;
    private Long verifiedStudents;
    private Long eligibleForDrives;
    private Long totalStudents; // backward compatibility
    private Long placedStudents;
    private Long totalOffers;
    private Double placementPercentage;
    private Long ongoingDrives;
    private Long activeApplications;

    // Verification Status Distribution
    private VerificationDistribution statusDistribution;

    // Monthly Verification Trend
    private List<MonthlyTrend> monthlyTrend;

    // Drive Eligibility Breakdown
    private List<DriveEligibility> driveEligibility;

    @Data
    @Builder
    public static class VerificationDistribution {
        private Long pending;
        private Long verified;
        private Long rejected;
    }

    @Data
    @Builder
    public static class MonthlyTrend {
        private String month;
        private Long verified;
    }

    @Data
    @Builder
    public static class DriveEligibility {
        private String driveName;
        private Long eligibleCount;
    }
}
