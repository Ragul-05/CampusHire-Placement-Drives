package com.example.backend.Services;

import com.example.backend.Models.AcademicRecord;
import com.example.backend.Models.Department;
import com.example.backend.Models.EligibilityCriteria;
import com.example.backend.Models.PlacementDrive;
import com.example.backend.Models.SchoolingDetails;
import com.example.backend.Models.StudentProfile;
import com.example.backend.Models.StudentSkill;
import com.example.backend.Models.enums.VerificationStatus;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class PlacementEligibilityService {

    @Autowired
    private StudentProfileService studentProfileService;

    public EligibilityEvaluation evaluate(StudentProfile profile, PlacementDrive drive) {
        List<String> reasons = new ArrayList<>();

        if (profile == null) {
            reasons.add("Student profile not found.");
            return new EligibilityEvaluation(false, reasons);
        }
        if (drive == null) {
            reasons.add("Placement drive not found.");
            return new EligibilityEvaluation(false, reasons);
        }

        if (profile.getVerificationStatus() != VerificationStatus.VERIFIED) {
            reasons.add("Profile must be verified by faculty.");
        }
        if (!Boolean.TRUE.equals(profile.getIsEligibleForPlacements())) {
            reasons.add("Faculty has not marked this profile eligible for placements.");
        }

        double completion = studentProfileService.calculateCompletionPercentage(profile);
        if (completion < 80.0) {
            reasons.add("Profile completion is " + String.format(Locale.ENGLISH, "%.1f", completion)
                    + "%; minimum 80% is required.");
        }

        EligibilityCriteria criteria = drive.getEligibilityCriteria();
        if (criteria != null) {
            AcademicRecord academic = profile.getAcademicRecord();
            SchoolingDetails schooling = profile.getSchoolingDetails();

            if (criteria.getMinCgpa() != null) {
                Double cgpa = academic != null ? academic.getCgpa() : null;
                if (cgpa == null || cgpa < criteria.getMinCgpa()) {
                    reasons.add("CGPA does not meet the minimum requirement.");
                }
            }

            if (criteria.getMinXMarks() != null) {
                Double xMarks = schooling != null ? schooling.getXMarksPercentage() : null;
                if (xMarks == null || xMarks < criteria.getMinXMarks()) {
                    reasons.add("10th marks do not meet the minimum requirement.");
                }
            }

            if (criteria.getMinXiiMarks() != null) {
                Double xiiMarks = schooling != null ? schooling.getXiiMarksPercentage() : null;
                if (xiiMarks == null || xiiMarks < criteria.getMinXiiMarks()) {
                    reasons.add("12th marks do not meet the minimum requirement.");
                }
            }

            if (criteria.getMaxStandingArrears() != null) {
                Integer standing = academic != null ? academic.getStandingArrears() : null;
                int currentStanding = standing != null ? standing : 0;
                if (currentStanding > criteria.getMaxStandingArrears()) {
                    reasons.add("Standing arrears exceed the allowed limit.");
                }
            }

            if (criteria.getMaxHistoryOfArrears() != null) {
                Integer history = academic != null ? academic.getHistoryOfArrears() : null;
                int currentHistory = history != null ? history : 0;
                if (currentHistory > criteria.getMaxHistoryOfArrears()) {
                    reasons.add("History of arrears exceeds the allowed limit.");
                }
            }

            if (criteria.getGraduationYear() != null) {
                Integer graduationYear = academic != null ? academic.getUgYearOfPass() : null;
                if (graduationYear == null || !criteria.getGraduationYear().equals(graduationYear)) {
                    reasons.add("Graduation year does not match the drive requirement.");
                }
            }

            if (criteria.getAllowedDepartments() != null && !criteria.getAllowedDepartments().isEmpty()) {
                Long studentDepartmentId = profile.getUser() != null && profile.getUser().getDepartment() != null
                        ? profile.getUser().getDepartment().getId()
                        : null;
                boolean allowedDepartment = criteria.getAllowedDepartments().stream()
                        .map(Department::getId)
                        .anyMatch(id -> id != null && id.equals(studentDepartmentId));
                if (!allowedDepartment) {
                    reasons.add("Student department is not allowed for this drive.");
                }
            }

            if (criteria.getRequiredSkills() != null && !criteria.getRequiredSkills().isEmpty()) {
                Set<String> studentSkills = profile.getSkills() == null ? Set.of()
                        : profile.getSkills().stream()
                                .map(StudentSkill::getSkillName)
                                .filter(skill -> skill != null && !skill.isBlank())
                                .map(skill -> skill.trim().toLowerCase(Locale.ENGLISH))
                                .collect(Collectors.toCollection(LinkedHashSet::new));

                List<String> missingSkills = criteria.getRequiredSkills().stream()
                        .filter(skill -> skill != null && !skill.isBlank())
                        .map(skill -> skill.trim().toLowerCase(Locale.ENGLISH))
                        .filter(skill -> !studentSkills.contains(skill))
                        .collect(Collectors.toList());

                if (!missingSkills.isEmpty()) {
                    reasons.add("Missing required skills: " + String.join(", ", missingSkills));
                }
            }
        }

        return new EligibilityEvaluation(reasons.isEmpty(), reasons);
    }

    public static class EligibilityEvaluation {
        private final boolean eligible;
        private final List<String> reasons;

        public EligibilityEvaluation(boolean eligible, List<String> reasons) {
            this.eligible = eligible;
            this.reasons = reasons;
        }

        public boolean isEligible() {
            return eligible;
        }

        public List<String> getReasons() {
            return reasons;
        }

        public String getPrimaryReason() {
            return reasons.isEmpty() ? null : reasons.get(0);
        }
    }
}
