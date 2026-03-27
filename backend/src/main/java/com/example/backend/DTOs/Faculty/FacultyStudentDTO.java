package com.example.backend.DTOs.Faculty;

import lombok.Builder;
import lombok.Data;
import java.util.List;

@Data
@Builder
public class FacultyStudentDTO {
    private Long id;
    private Long userId; // For accessing email, etc.
    private String rollNo;
    private String batch;
    private String name;
    private String email;
    private String verificationStatus;
    private Boolean isLocked;
    private Boolean isEligibleForPlacements;
    private Boolean eligibleForAdminReview;
    private Boolean isPlaced;
    private Integer numberOfOffers;
    private Double highestPackageLpa;

    private Double cgpa;
    private Integer standingArrears;
    private Integer historyOfArrears;

    private Boolean facultyApproved;
    private String currentStage;

    private String department;
    private Integer graduationYear;

    // Skills could be aggregated as a single string or list
    private List<String> skills;
}
