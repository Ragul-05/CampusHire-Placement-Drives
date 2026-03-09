package com.example.backend.Services;

import com.example.backend.DTOs.Admin.AnalyticsResponseDTO;
import com.example.backend.Models.enums.VerificationStatus;
import com.example.backend.Repositories.OfferRepository;
import com.example.backend.Repositories.StudentProfileRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class AdminAnalyticsService {

    @Autowired
    private StudentProfileRepository studentRepository;

    @Autowired
    private OfferRepository offerRepository;

    public AnalyticsResponseDTO getPlacementAnalytics() {
        long totalVerified = studentRepository.countByVerificationStatus(VerificationStatus.VERIFIED);
        long totalPlaced = studentRepository.countByIsPlacedTrue();

        double placementRate = totalVerified > 0 ? ((double) totalPlaced / totalVerified) * 100 : 0.0;
        placementRate = Math.round(placementRate * 100.0) / 100.0;

        List<Object[]> branchData = studentRepository.countPlacementsByDepartment();
        Map<String, Long> branchWisePlacements = new HashMap<>();
        for (Object[] row : branchData) {
            branchWisePlacements.put((String) row[0], ((Number) row[1]).longValue());
        }

        List<Object[]> recruiterData = offerRepository.countOffersByCompany();
        Map<String, Long> topRecruiters = new HashMap<>();
        int count = 0;
        for (Object[] row : recruiterData) {
            if (count >= 5)
                break; // Top 5
            topRecruiters.put((String) row[0], ((Number) row[1]).longValue());
            count++;
        }

        return AnalyticsResponseDTO.builder()
                .placementRate(placementRate)
                .totalPlaced(totalPlaced)
                .totalVerified(totalVerified)
                .branchWisePlacements(branchWisePlacements)
                .topRecruiters(topRecruiters)
                .build();
    }
}
