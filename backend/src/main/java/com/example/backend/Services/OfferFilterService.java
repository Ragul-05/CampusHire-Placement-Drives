package com.example.backend.Services;

import com.example.backend.DTOs.Offers.OfferFilterResponseDTO;
import com.example.backend.DTOs.Offers.OfferFilterRowDTO;
import com.example.backend.DTOs.Offers.OfferFilterSummaryDTO;
import com.example.backend.Exceptions.ResourceNotFoundException;
import com.example.backend.Exceptions.UnauthorizedActionException;
import com.example.backend.Models.User;
import com.example.backend.Models.enums.Role;
import com.example.backend.Repositories.OfferRepository;
import com.example.backend.Repositories.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
public class OfferFilterService {

    @Autowired
    private OfferRepository offerRepository;

    @Autowired
    private UserRepository userRepository;

    @Transactional(readOnly = true)
    public OfferFilterResponseDTO getAdminOfferFilters(String offerFilter) {
        return buildResponse(null, offerFilter);
    }

    @Transactional(readOnly = true)
    public OfferFilterResponseDTO getFacultyOfferFilters(String facultyEmail, String offerFilter) {
        User faculty = userRepository.findByEmail(facultyEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Faculty not found"));

        if (faculty.getRole() != Role.FACULTY) {
            throw new UnauthorizedActionException("Only faculty can access faculty offer filters");
        }
        if (faculty.getDepartment() == null) {
            throw new UnauthorizedActionException("Faculty is not assigned to a department");
        }

        return buildResponse(faculty.getDepartment().getId(), offerFilter);
    }

    private OfferFilterResponseDTO buildResponse(Long departmentId, String offerFilter) {
        String normalizedFilter = normalizeFilter(offerFilter);

        List<OfferFilterRowDTO> allRows = mapRows(offerRepository.findOfferFilterRows(departmentId, "ALL"));
        List<OfferFilterRowDTO> filteredRows = "ALL".equals(normalizedFilter)
                ? allRows
                : mapRows(offerRepository.findOfferFilterRows(departmentId, normalizedFilter));

        long totalStudentsWithOffers = allRows.size();
        long singleOfferStudents = allRows.stream().filter(row -> row.getOfferCount() != null && row.getOfferCount() == 1L).count();
        long multipleOfferStudents = allRows.stream().filter(row -> row.getOfferCount() != null && row.getOfferCount() >= 2L).count();

        return OfferFilterResponseDTO.builder()
                .summary(OfferFilterSummaryDTO.builder()
                        .totalStudentsWithOffers(totalStudentsWithOffers)
                        .singleOfferStudents(singleOfferStudents)
                        .multipleOfferStudents(multipleOfferStudents)
                        .build())
                .rows(filteredRows)
                .build();
    }

    private List<OfferFilterRowDTO> mapRows(List<Object[]> rawRows) {
        List<OfferFilterRowDTO> rows = new ArrayList<>();
        for (Object[] row : rawRows) {
            rows.add(OfferFilterRowDTO.builder()
                    .studentId(asLong(row, 0))
                    .studentName(asString(row, 1))
                    .departmentName(asString(row, 2))
                    .departmentId(asLong(row, 3))
                    .offerCount(asLong(row, 4))
                    .companyNames(asString(row, 5))
                    .packages(asString(row, 6))
                    .build());
        }
        return rows;
    }

    private String normalizeFilter(String offerFilter) {
        if (offerFilter == null || offerFilter.trim().isEmpty()) {
            return "ALL";
        }

        String normalized = offerFilter.trim().toUpperCase();
        return switch (normalized) {
            case "1 OFFER", "ONE", "SINGLE", "SINGLE OFFER" -> "SINGLE";
            case "MULTIPLE", "MULTIPLE OFFERS", "2+", "2 OR MORE" -> "MULTIPLE";
            default -> "ALL";
        };
    }

    private String asString(Object[] row, int index) {
        Object value = row[index];
        return value == null ? null : value.toString();
    }

    private Long asLong(Object[] row, int index) {
        Object value = row[index];
        if (value == null) {
            return null;
        }
        if (value instanceof Number number) {
            return number.longValue();
        }
        return Long.parseLong(value.toString());
    }
}
