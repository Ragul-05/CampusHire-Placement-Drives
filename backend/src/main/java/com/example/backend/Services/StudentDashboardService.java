package com.example.backend.Services;

import com.example.backend.Repositories.CompanyRepository;
import com.example.backend.Repositories.PlacementDriveRepository;
import com.example.backend.Repositories.StudentProfileRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Service
public class StudentDashboardService {

    @Autowired
    private StudentProfileRepository studentProfileRepository;

    @Autowired
    private PlacementDriveRepository driveRepository;

    @Autowired
    private CompanyRepository companyRepository;

    public Map<String, Object> getDashboardStats() {
        Map<String, Object> stats = new HashMap<>();

        // Assuming isPlaced = true indicates a successfully placed student
        long totalPlaced = studentProfileRepository.countByIsPlacedTrue();

        long ongoingDrives = driveRepository.countByStatus(com.example.backend.Models.enums.DriveStatus.ONGOING);

        long totalCompanies = companyRepository.count();

        // Let's assume highest CTC is dynamically found
        Double highestCtc = driveRepository.findTopByOrderByCtcLpaDesc()
                .map(com.example.backend.Models.PlacementDrive::getCtcLpa)
                .orElse(0.0);

        stats.put("totalPlaced", totalPlaced);
        stats.put("ongoingDrives", ongoingDrives);
        stats.put("totalCompanies", totalCompanies);
        stats.put("highestCtcLpa", highestCtc);

        return stats;
    }
}
