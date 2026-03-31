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
    private Boolean hasApplied;

    private String department;
    private Integer graduationYear;
    private Double profileCompletionPercentage;
    private String phoneNumber;
    private String linkedinUrl;
    private String githubUrl;
    private Double xMarksPercentage;
    private Double xiiMarksPercentage;
    private String latestVerificationRemarks;

    private List<String> skills;
    private PersonalDetailsView personalDetails;
    private List<AcademicRecordView> academicRecords;
    private List<CertificationView> certifications;

    @Data
    @Builder
    public static class PersonalDetailsView {
        private String dateOfBirth;
        private String gender;
        private String address;
    }

    @Data
    @Builder
    public static class AcademicRecordView {
        private String degree;
        private String institution;
        private Double percentage;
        private Integer yearOfCompletion;
    }

    @Data
    @Builder
    public static class CertificationView {
        private String name;
        private String issuingOrganization;
        private String issueDate;
    }
}
