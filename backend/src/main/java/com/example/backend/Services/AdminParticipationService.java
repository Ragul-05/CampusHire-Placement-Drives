package com.example.backend.Services;

import com.example.backend.DTOs.Admin.ParticipationStatsDTO;
import com.example.backend.Models.DriveApplication;
import com.example.backend.Models.enums.ApplicationStage;
import com.example.backend.Repositories.DriveApplicationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class AdminParticipationService {

    @Autowired
    private DriveApplicationRepository driveApplicationRepository;

    public ParticipationStatsDTO getDriveParticipationStats(Long driveId) {
        List<DriveApplication> applications = driveApplicationRepository.findByDriveId(driveId);

        long totalApplicants = applications.size();

        Map<ApplicationStage, Long> stageBreakdown = applications.stream()
                .collect(Collectors.groupingBy(DriveApplication::getStage, Collectors.counting()));

        Map<String, Long> departmentBreakdown = applications.stream()
                .collect(Collectors.groupingBy(
                        app -> app.getStudentProfile().getUser().getDepartment() != null
                                ? app.getStudentProfile().getUser().getDepartment().getName()
                                : "N/A",
                        Collectors.counting()));

        return ParticipationStatsDTO.builder()
                .driveId(driveId)
                .totalApplicants(totalApplicants)
                .stageBreakdown(stageBreakdown)
                .departmentBreakdown(departmentBreakdown)
                .build();
    }
}
