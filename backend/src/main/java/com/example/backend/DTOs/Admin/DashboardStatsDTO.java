package com.example.backend.DTOs.Admin;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class DashboardStatsDTO {
    private long totalStudents;
    private long verifiedStudents;
    private long placedStudents;
    private long ongoingDrives;
    private long completedDrives;
    private double highestCtc;
    private double averageCtc;
    private long totalCompanies;
}
