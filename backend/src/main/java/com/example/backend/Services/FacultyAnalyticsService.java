package com.example.backend.Services;

import com.example.backend.DTOs.Faculty.FacultyAnalyticsDTO;
import com.example.backend.Exceptions.ResourceNotFoundException;
import com.example.backend.Exceptions.UnauthorizedActionException;
import com.example.backend.Models.Offer;
import com.example.backend.Models.StudentProfile;
import com.example.backend.Models.User;
import com.example.backend.Repositories.OfferRepository;
import com.example.backend.Repositories.StudentProfileRepository;
import com.example.backend.Repositories.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.format.TextStyle;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class FacultyAnalyticsService {

    @Autowired
    private StudentProfileRepository studentProfileRepository;

        @Autowired
        private OfferRepository offerRepository;

    @Autowired
    private UserRepository userRepository;

    private User getAuthenticatedFaculty(String email) {
        User faculty = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Faculty not found"));
        if (faculty.getDepartment() == null) {
            throw new UnauthorizedActionException("Faculty is not assigned to any department");
        }
        return faculty;
    }

    public FacultyAnalyticsDTO getDepartmentAnalytics(String facultyEmail) {
        User faculty = getAuthenticatedFaculty(facultyEmail);
        Long departmentId = faculty.getDepartment().getId();

        List<StudentProfile> students = studentProfileRepository.findByUserDepartmentId(departmentId);
        List<Offer> offers = offerRepository.findByStudentProfileUserDepartmentIdOrderByIssuedAtDesc(departmentId);

        long totalStudents = students.size();
        long totalOffers = offers.size();
        List<StudentProfile> placedStudents = students.stream().filter(s -> s.getIsPlaced() != null && s.getIsPlaced())
                .collect(Collectors.toList());
        long totalPlaced = placedStudents.size();

        double averagePackage = offers.stream()
                .filter(offer -> offer.getCtc() != null)
                .mapToDouble(Offer::getCtc)
                .average()
                .orElse(0.0);

        double highestPackage = offers.stream()
                .filter(offer -> offer.getCtc() != null)
                .mapToDouble(Offer::getCtc)
                .max()
                .orElse(0.0);

        double placementPercentage = totalStudents > 0 ? ((double) totalPlaced / totalStudents) * 100 : 0.0;
        placementPercentage = Math.round(placementPercentage * 100.0) / 100.0;
        averagePackage = Math.round(averagePackage * 100.0) / 100.0;

        Map<String, Long> topRecruiters = offerRepository.countOffersByCompanyForDepartment(departmentId).stream()
                .collect(Collectors.toMap(
                        row -> (String) row[0],
                        row -> ((Number) row[1]).longValue(),
                        (a, b) -> a,
                        LinkedHashMap::new));

        Map<String, Long> monthlyOfferTrend = calculateMonthlyOfferTrend(offers);

        return FacultyAnalyticsDTO.builder()
                .totalEligible(totalStudents)
                .totalPlaced(totalPlaced)
                .totalOffers(totalOffers)
                .placementPercentage(placementPercentage)
                .averagePackageLpa(averagePackage)
                .highestPackageLpa(highestPackage)
                .topRecruiters(topRecruiters)
                .monthlyOfferTrend(monthlyOfferTrend)
                .build();
    }

    private Map<String, Long> calculateMonthlyOfferTrend(List<Offer> offers) {
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
