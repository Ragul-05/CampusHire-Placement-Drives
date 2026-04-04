package com.example.backend.Services;

import com.example.backend.DTOs.Results.CompanyRoundAnalysisDTO;
import com.example.backend.DTOs.Results.PlacementResultsResponseDTO;
import com.example.backend.DTOs.Results.PlacementResultsSummaryDTO;
import com.example.backend.DTOs.Results.PlacementStatusRowDTO;
import com.example.backend.DTOs.Results.StudentRoundTrackingDTO;
import com.example.backend.Exceptions.ResourceNotFoundException;
import com.example.backend.Exceptions.UnauthorizedActionException;
import com.example.backend.Models.DriveApplication;
import com.example.backend.Models.Offer;
import com.example.backend.Models.StudentProfile;
import com.example.backend.Models.User;
import com.example.backend.Models.enums.ApplicationStage;
import com.example.backend.Models.enums.Role;
import com.example.backend.Repositories.DriveApplicationRepository;
import com.example.backend.Repositories.OfferRepository;
import com.example.backend.Repositories.StudentProfileRepository;
import com.example.backend.Repositories.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class PlacementResultsService {

    @Autowired
    private StudentProfileRepository studentProfileRepository;

    @Autowired
    private DriveApplicationRepository driveApplicationRepository;

    @Autowired
    private OfferRepository offerRepository;

    @Autowired
    private UserRepository userRepository;

    public PlacementResultsResponseDTO getAdminPlacementResults() {
        return buildResults(null);
    }

    public PlacementResultsResponseDTO getFacultyPlacementResults(String facultyEmail) {
        User faculty = userRepository.findByEmail(facultyEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Faculty not found"));

        if (faculty.getRole() != Role.FACULTY) {
            throw new UnauthorizedActionException("Only faculty can access faculty placement results");
        }
        if (faculty.getDepartment() == null) {
            throw new UnauthorizedActionException("Faculty is not assigned to a department");
        }

        return buildResults(faculty.getDepartment().getId());
    }

    private PlacementResultsResponseDTO buildResults(Long departmentId) {
        List<StudentProfile> students = departmentId == null
                ? studentProfileRepository.findAll()
                : studentProfileRepository.findByUserDepartmentId(departmentId);

        List<DriveApplication> applications = departmentId == null
                ? driveApplicationRepository.findAll()
                : driveApplicationRepository.findByStudentProfileUserDepartmentId(departmentId);

        List<Offer> offers = departmentId == null
                ? offerRepository.findAllByOrderByIssuedAtDesc()
                : offerRepository.findByStudentProfileUserDepartmentIdOrderByIssuedAtDesc(departmentId);

        Map<Long, Offer> latestOfferByStudent = new HashMap<>();
        for (Offer offer : offers) {
            Long studentId = offer.getStudentProfile().getId();
            if (!latestOfferByStudent.containsKey(studentId)) {
                latestOfferByStudent.put(studentId, offer);
            }
        }

        long totalStudents = students.size();
        long placedStudents = students.stream()
                .filter(student -> isPlaced(student, latestOfferByStudent.get(student.getId())))
                .count();
        long unplacedStudents = Math.max(0, totalStudents - placedStudents);
        double placementPercentage = totalStudents == 0
                ? 0.0
                : ((double) placedStudents / (double) totalStudents) * 100.0;
        placementPercentage = Math.round(placementPercentage * 100.0) / 100.0;

        List<PlacementStatusRowDTO> placedVsUnplaced = students.stream()
                .map(student -> {
                    Offer latestOffer = latestOfferByStudent.get(student.getId());
                    boolean placed = isPlaced(student, latestOffer);
                    return PlacementStatusRowDTO.builder()
                            .studentId(student.getId())
                            .studentName(getStudentName(student))
                            .department(getDepartmentName(student))
                            .placementStatus(placed ? "PLACED" : "UNPLACED")
                            .companyName(placed ? getCompanyName(student, latestOffer) : null)
                            .ctc(placed ? getCtc(student, latestOffer) : null)
                            .build();
                })
                .sorted(Comparator.comparing(PlacementStatusRowDTO::getStudentName, String.CASE_INSENSITIVE_ORDER))
                .collect(Collectors.toList());

        List<CompanyRoundAnalysisDTO> companyRoundAnalysis = buildCompanyRoundAnalysis(departmentId);

        Map<Long, Boolean> placedFlagByStudent = students.stream().collect(Collectors.toMap(
                StudentProfile::getId,
                student -> isPlaced(student, latestOfferByStudent.get(student.getId()))
        ));

        List<StudentRoundTrackingDTO> studentRoundTracking = applications.stream()
                .map(application -> StudentRoundTrackingDTO.builder()
                        .studentId(application.getStudentProfile().getId())
                        .studentName(getStudentName(application.getStudentProfile()))
                        .companyName(application.getDrive().getCompany() != null
                                ? application.getDrive().getCompany().getName()
                                : "N/A")
                        .currentStage(application.getStage() != null ? application.getStage().name() : "ELIGIBLE")
                        .roundsCleared(roundsClearedForStage(application.getStage()))
                        .placementStatus(Boolean.TRUE.equals(placedFlagByStudent.get(application.getStudentProfile().getId()))
                                ? "PLACED"
                                : "UNPLACED")
                        .build())
                .sorted(Comparator.comparing(StudentRoundTrackingDTO::getStudentName, String.CASE_INSENSITIVE_ORDER))
                .collect(Collectors.toList());

        return PlacementResultsResponseDTO.builder()
                .summary(PlacementResultsSummaryDTO.builder()
                        .totalStudents(totalStudents)
                        .placedStudents(placedStudents)
                        .unplacedStudents(unplacedStudents)
                        .placementPercentage(placementPercentage)
                        .build())
                .placedVsUnplaced(placedVsUnplaced)
                .companyRoundAnalysis(companyRoundAnalysis)
                .studentRoundTracking(studentRoundTracking)
                .build();
    }

    private List<CompanyRoundAnalysisDTO> buildCompanyRoundAnalysis(Long departmentId) {
        List<Object[]> groupedRows = driveApplicationRepository.countByCompanyAndStage(departmentId);
        Map<String, long[]> roundCountsByCompany = new LinkedHashMap<>();

        for (Object[] row : groupedRows) {
            String company = row[0] != null ? row[0].toString() : "Unknown";
            ApplicationStage stage = row[1] instanceof ApplicationStage
                    ? (ApplicationStage) row[1]
                    : ApplicationStage.valueOf(String.valueOf(row[1]));
            long count = row[2] instanceof Number ? ((Number) row[2]).longValue() : 0L;

            long[] rounds = roundCountsByCompany.computeIfAbsent(company, key -> new long[] {0L, 0L, 0L});
            if (stage == ApplicationStage.ASSESSMENT || stage == ApplicationStage.TECHNICAL
                    || stage == ApplicationStage.HR || stage == ApplicationStage.SELECTED) {
                rounds[0] += count;
            }
            if (stage == ApplicationStage.TECHNICAL || stage == ApplicationStage.HR || stage == ApplicationStage.SELECTED) {
                rounds[1] += count;
            }
            if (stage == ApplicationStage.HR || stage == ApplicationStage.SELECTED) {
                rounds[2] += count;
            }
        }

        List<CompanyRoundAnalysisDTO> response = new ArrayList<>();
        for (Map.Entry<String, long[]> entry : roundCountsByCompany.entrySet()) {
            long[] rounds = entry.getValue();
            response.add(CompanyRoundAnalysisDTO.builder()
                    .companyName(entry.getKey())
                    .round1AssessmentCleared(rounds[0])
                    .round2TechnicalCleared(rounds[1])
                    .round3HrCleared(rounds[2])
                    .build());
        }

        response.sort(Comparator.comparing(CompanyRoundAnalysisDTO::getCompanyName, String.CASE_INSENSITIVE_ORDER));
        return response;
    }

    private boolean isPlaced(StudentProfile student, Offer latestOffer) {
        return Boolean.TRUE.equals(student.getIsPlaced()) || latestOffer != null;
    }

    private String getCompanyName(StudentProfile student, Offer latestOffer) {
        if (latestOffer != null && latestOffer.getDrive() != null && latestOffer.getDrive().getCompany() != null) {
            return latestOffer.getDrive().getCompany().getName();
        }
        if (student.getOptedOffer() != null && !student.getOptedOffer().isBlank()) {
            return student.getOptedOffer();
        }
        return null;
    }

    private Double getCtc(StudentProfile student, Offer latestOffer) {
        if (latestOffer != null && latestOffer.getCtc() != null) {
            return latestOffer.getCtc();
        }
        return student.getHighestPackageLpa();
    }

    private int roundsClearedForStage(ApplicationStage stage) {
        if (stage == null) return 0;
        return switch (stage) {
            case ASSESSMENT -> 1;
            case TECHNICAL -> 2;
            case HR, SELECTED -> 3;
            default -> 0;
        };
    }

    private String getDepartmentName(StudentProfile student) {
        if (student.getUser() != null && student.getUser().getDepartment() != null) {
            return student.getUser().getDepartment().getName();
        }
        return "N/A";
    }

    private String getStudentName(StudentProfile student) {
        if (student.getPersonalDetails() != null && student.getPersonalDetails().getFirstName() != null
                && !student.getPersonalDetails().getFirstName().isBlank()) {
            String firstName = student.getPersonalDetails().getFirstName().trim();
            String lastName = student.getPersonalDetails().getLastName() != null
                    ? student.getPersonalDetails().getLastName().trim()
                    : "";
            return (firstName + " " + lastName).trim();
        }
        if (student.getUser() != null && student.getUser().getEmail() != null) {
            return student.getUser().getEmail();
        }
        return "Student";
    }
}
