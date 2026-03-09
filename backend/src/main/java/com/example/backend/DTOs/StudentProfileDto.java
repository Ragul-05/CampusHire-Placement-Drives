package com.example.backend.DTOs;

import lombok.Data;
import lombok.Builder;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StudentProfileDto {
    private Long id;
    private String rollNo;
    private String batch;
    // Register number from users table
    private String registerNumber;
    private String email;
    private String departmentName;

    // Resume
    private String resumeUrl;
    private String resumeFileName;
    private LocalDateTime resumeUploadedAt;
    private String resumeSummary;

    private String verificationStatus;
    private Boolean isLocked;
    private Boolean isEligibleForPlacements;
    private Boolean interestedOnPlacement;
    private Boolean isPlaced;
    private Integer numberOfOffers;
    private Double highestPackageLpa;

    private PersonalDetailsDto     personalDetails;
    private ContactDetailsDto      contactDetails;
    private AcademicRecordDto      academicRecord;
    private SchoolingDetailsDto    schoolingDetails;
    private ProfessionalProfileDto professionalProfile;
    private List<CertificationDto> certifications;
    private List<SkillDto>         skills;
    private IdentityDocsDto        identityDocs;
    private ResumeDto              resume;

    /* ── 1. Personal Details ── */
    @Data @NoArgsConstructor @AllArgsConstructor
    public static class PersonalDetailsDto {
        private String    firstName;
        private String    lastName;
        private String    fatherName;
        private String    motherName;
        private String    fatherOccupation;
        private String    motherOccupation;
        private String    gender;
        private String    community;
        private LocalDate dateOfBirth;
        private String    hostelerOrDayScholar;
        private String    bio;
    }

    /* ── 2. Contact Details ── */
    @Data @NoArgsConstructor @AllArgsConstructor
    public static class ContactDetailsDto {
        private String alternateEmail;
        private String studentMobile1;
        private String studentMobile2;
        private String parentMobile;
        private String landlineNo;
        private String fullAddress;
        private String city;
        private String state;
        private String pincode;
    }

    /* ── 3. Academic Record ── */
    @Data @NoArgsConstructor @AllArgsConstructor
    public static class AcademicRecordDto {
        private Integer ugYearOfPass;
        private String  admissionQuota;
        private String  mediumOfInstruction;
        private String  locality;
        private Double  sem1Gpa;
        private Double  sem2Gpa;
        private Double  sem3Gpa;
        private Double  sem4Gpa;
        private Double  sem5Gpa;
        private Double  sem6Gpa;
        private Double  sem7Gpa;
        private Double  sem8Gpa;
        private Double  cgpa;
        private Integer standingArrears;
        private Integer historyOfArrears;
        private Boolean hasHistoryOfArrears;
        private Integer courseGapInYears;
    }

    /* ── 4. Schooling Details ── */
    @Data @NoArgsConstructor @AllArgsConstructor
    public static class SchoolingDetailsDto {
        private Double  xMarksPercentage;
        private Integer xYearOfPassing;
        private String  xSchoolName;
        private String  xBoardOfStudy;
        private Double  xiiMarksPercentage;
        private Integer xiiYearOfPassing;
        private String  xiiSchoolName;
        private String  xiiBoardOfStudy;
        private Double  xiiCutOffMarks;
        private Double  diplomaMarksPercentage;
    }

    /* ── 5. Professional Profile ── */
    @Data @NoArgsConstructor @AllArgsConstructor
    public static class ProfessionalProfileDto {
        private String  linkedinProfileUrl;
        private String  githubProfileUrl;
        private String  portfolioUrl;
        private String  leetcodeProfileUrl;
        private Integer leetcodeProblemsSolved;
        private String  leetcodeRating;
        private String  hackerrankProfileUrl;
        private String  codechefProfileUrl;
        private String  codeforcesProfileUrl;
    }

    /* ── 6. Certification ── */
    @Data @NoArgsConstructor @AllArgsConstructor
    public static class CertificationDto {
        private Long   id;
        private String skillName;
        private String duration;
        private String vendor;
    }

    /* ── 7. Skill ── */
    @Data @NoArgsConstructor @AllArgsConstructor
    public static class SkillDto {
        private Long   id;
        private String skillName;
        private String proficiencyLevel;  // Beginner / Intermediate / Advanced / Expert
        private String category;          // Technical / Soft / Language / Tool
    }

    /* ── 8. Identity Docs ── */
    @Data @NoArgsConstructor @AllArgsConstructor
    public static class IdentityDocsDto {
        private Boolean isAadharAvailable;
        private String  aadharNumber;
        private String  nameAsPerAadhar;
        private String  familyCardNumber;
        private Boolean isPanCardAvailable;
        private Boolean isPassportAvailable;
    }

    /* ── 9. Resume (grouped for the Resume tab) ── */
    @Data @NoArgsConstructor @AllArgsConstructor
    public static class ResumeDto {
        private String        resumeUrl;
        private String        resumeFileName;
        private LocalDateTime resumeUploadedAt;  // read-only — set by backend on save
        private String        resumeSummary;
    }
}
