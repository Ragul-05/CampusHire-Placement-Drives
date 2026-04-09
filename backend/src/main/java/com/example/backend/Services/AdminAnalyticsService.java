package com.example.backend.Services;

import com.example.backend.DTOs.Admin.AnalyticsResponseDTO;
import com.example.backend.Models.Offer;
import com.example.backend.Models.enums.VerificationStatus;
import com.example.backend.Repositories.OfferRepository;
import com.example.backend.Repositories.StudentProfileRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.format.TextStyle;
import java.util.LinkedHashMap;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
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
        long totalOffers = offerRepository.count();

        double placementRate = totalVerified > 0 ? ((double) totalPlaced / totalVerified) * 100 : 0.0;
        placementRate = Math.round(placementRate * 100.0) / 100.0;

        List<Object[]> branchData = studentRepository.countPlacementsByDepartment();
        Map<String, Long> branchWisePlacements = new HashMap<>();
        for (Object[] row : branchData) {
            branchWisePlacements.put((String) row[0], ((Number) row[1]).longValue());
        }

        List<Object[]> branchOfferRows = offerRepository.countOffersByDepartment();
        Map<String, Long> branchWiseOffers = new HashMap<>();
        for (Object[] row : branchOfferRows) {
            branchWiseOffers.put((String) row[0], ((Number) row[1]).longValue());
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

        Map<String, Long> monthlyOfferTrend = calculateMonthlyOfferTrend();

        return AnalyticsResponseDTO.builder()
                .placementRate(placementRate)
                .totalPlaced(totalPlaced)
                .totalVerified(totalVerified)
                .totalOffers(totalOffers)
                .branchWisePlacements(branchWisePlacements)
                .branchWiseOffers(branchWiseOffers)
                .topRecruiters(topRecruiters)
                .monthlyOfferTrend(monthlyOfferTrend)
                .build();
    }

    private Map<String, Long> calculateMonthlyOfferTrend() {
        List<Offer> offers = offerRepository.findAllByOrderByIssuedAtDesc();
        Map<String, Long> monthlyTrend = new LinkedHashMap<>();
        LocalDate now = LocalDate.now();

        for (int i = 5; i >= 0; i--) {
            LocalDate monthDate = now.minusMonths(i);
            String monthLabel = monthDate.getMonth().getDisplayName(TextStyle.SHORT, Locale.ENGLISH);

            long count = offers.stream()
                    .filter(offer -> offer.getIssuedAt() != null)
                    .filter(offer -> offer.getIssuedAt().getYear() == monthDate.getYear()
                            && offer.getIssuedAt().getMonthValue() == monthDate.getMonthValue())
                    .count();

            monthlyTrend.put(monthLabel, count);
        }
        return monthlyTrend;
    }
}
