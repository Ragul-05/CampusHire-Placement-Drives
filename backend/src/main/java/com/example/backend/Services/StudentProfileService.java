package com.example.backend.Services;

import com.example.backend.DTOs.StudentProfileDto;
import com.example.backend.Exceptions.ProfileLockedException;
import com.example.backend.Exceptions.ResourceNotFoundException;
import com.example.backend.Mappers.StudentMapper;
import com.example.backend.Models.*;
import com.example.backend.Models.enums.VerificationStatus;
import com.example.backend.Repositories.StudentProfileRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class StudentProfileService {

    @Autowired
    private StudentProfileRepository studentProfileRepository;

    /* ── GET profile (full, all lazy associations loaded) ── */
    @Transactional(readOnly = true)
    public StudentProfileDto getProfileByEmail(String email) {
        // Fetch all OneToOne sub-entities eagerly in one query
        StudentProfile profile = studentProfileRepository.findFullProfileByUserEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Profile not found for: " + email));
        // Certifications are @OneToMany — fetch separately to avoid MultipleBagFetchException
        // The @Transactional context keeps the session open so getCertifications() lazy-loads fine here
        StudentProfileDto dto = StudentMapper.toDto(profile);
        dto.setProfileCompletion(calculateCompletionPercentage(profile));
        return dto;
    }

    /* ── Verification status ── */
    @Transactional(readOnly = true)
    public String getVerificationStatus(String email) {
        StudentProfile profile = studentProfileRepository.findByUserEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Profile not found"));
        return profile.getVerificationStatus() != null ? profile.getVerificationStatus().name() : "PENDING";
    }

    /* ── Helper: load profile WITH all sub-entities eagerly so null-checks work ── */
    private StudentProfile getEditableProfile(String email) {
        StudentProfile profile = studentProfileRepository.findFullProfileByUserEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Profile not found for: " + email));
        if (Boolean.TRUE.equals(profile.getIsLocked())) {
            throw new ProfileLockedException("Profile is locked and cannot be edited");
        }
        if (profile.getVerificationStatus() == VerificationStatus.VERIFIED) {
            throw new ProfileLockedException("Verified profile cannot be edited");
        }
        return profile;
    }

    /* ════════════════════════════════════════════════════
       TAB 1 — Personal Details
    ════════════════════════════════════════════════════ */
    @Transactional
    public void updatePersonalDetails(String email, StudentProfileDto.PersonalDetailsDto d) {
        StudentProfile p = getEditableProfile(email);
        PersonalDetails pd = p.getPersonalDetails();
        if (pd == null) {
            pd = new PersonalDetails();
            pd.setId(p.getId());
            pd.setStudentProfile(p);
            p.setPersonalDetails(pd);
        }
        pd.setFirstName(trim(d.getFirstName()));
        pd.setLastName(trim(d.getLastName()));
        pd.setFatherName(trim(d.getFatherName()));
        pd.setMotherName(trim(d.getMotherName()));
        pd.setFatherOccupation(trim(d.getFatherOccupation()));
        pd.setMotherOccupation(trim(d.getMotherOccupation()));
        pd.setGender(trim(d.getGender()));
        pd.setCommunity(trim(d.getCommunity()));
        pd.setDateOfBirth(d.getDateOfBirth());
        pd.setHostelerOrDayScholar(trim(d.getHostelerOrDayScholar()));
        pd.setBio(trim(d.getBio()));
        markProfileDirty(p);
        studentProfileRepository.save(p);
    }

    /* ════════════════════════════════════════════════════
       TAB 2 — Contact Details
    ════════════════════════════════════════════════════ */
    @Transactional
    public void updateContactDetails(String email, StudentProfileDto.ContactDetailsDto d) {
        StudentProfile p = getEditableProfile(email);
        ContactDetails cd = p.getContactDetails();
        if (cd == null) {
            cd = new ContactDetails();
            cd.setId(p.getId());
            cd.setStudentProfile(p);
            p.setContactDetails(cd);
        }
        cd.setAlternateEmail(trim(d.getAlternateEmail()));
        cd.setStudentMobile1(trim(d.getStudentMobile1()));
        cd.setStudentMobile2(trim(d.getStudentMobile2()));
        cd.setParentMobile(trim(d.getParentMobile()));
        cd.setLandlineNo(trim(d.getLandlineNo()));
        cd.setFullAddress(trim(d.getFullAddress()));
        cd.setCity(trim(d.getCity()));
        cd.setState(trim(d.getState()));
        cd.setPincode(trim(d.getPincode()));
        markProfileDirty(p);
        studentProfileRepository.save(p);
    }

    /* ════════════════════════════════════════════════════
       TAB 3 — Academic Record
    ════════════════════════════════════════════════════ */
    @Transactional
    public void updateAcademicRecord(String email, StudentProfileDto.AcademicRecordDto d) {
        StudentProfile p = getEditableProfile(email);
        AcademicRecord ar = p.getAcademicRecord();
        if (ar == null) {
            ar = new AcademicRecord();
            ar.setId(p.getId());
            ar.setStudentProfile(p);
            p.setAcademicRecord(ar);
        }
        ar.setUgYearOfPass(d.getUgYearOfPass());
        ar.setAdmissionQuota(trim(d.getAdmissionQuota()));
        ar.setMediumOfInstruction(trim(d.getMediumOfInstruction()));
        ar.setLocality(trim(d.getLocality()));
        ar.setSem1Gpa(d.getSem1Gpa());
        ar.setSem2Gpa(d.getSem2Gpa());
        ar.setSem3Gpa(d.getSem3Gpa());
        ar.setSem4Gpa(d.getSem4Gpa());
        ar.setSem5Gpa(d.getSem5Gpa());
        ar.setSem6Gpa(d.getSem6Gpa());
        ar.setSem7Gpa(d.getSem7Gpa());
        ar.setSem8Gpa(d.getSem8Gpa());
        // cgpa has nullable=false — default to 0.0 if not provided
        ar.setCgpa(d.getCgpa() != null ? d.getCgpa() : 0.0);
        ar.setStandingArrears(d.getStandingArrears() != null ? d.getStandingArrears() : 0);
        ar.setHistoryOfArrears(d.getHistoryOfArrears() != null ? d.getHistoryOfArrears() : 0);
        ar.setHasHistoryOfArrears(Boolean.TRUE.equals(d.getHasHistoryOfArrears()));
        ar.setCourseGapInYears(d.getCourseGapInYears() != null ? d.getCourseGapInYears() : 0);
        markProfileDirty(p);
        studentProfileRepository.save(p);
    }

    /* ════════════════════════════════════════════════════
       TAB 4 — Schooling Details
    ════════════════════════════════════════════════════ */
    @Transactional
    public void updateSchoolingDetails(String email, StudentProfileDto.SchoolingDetailsDto d) {
        StudentProfile p = getEditableProfile(email);
        SchoolingDetails sd = p.getSchoolingDetails();
        if (sd == null) {
            sd = new SchoolingDetails();
            sd.setId(p.getId());
            sd.setStudentProfile(p);
            p.setSchoolingDetails(sd);
        }
        sd.setXMarksPercentage(d.getXMarksPercentage());
        sd.setXYearOfPassing(d.getXYearOfPassing());
        sd.setXSchoolName(trim(d.getXSchoolName()));
        sd.setXBoardOfStudy(trim(d.getXBoardOfStudy()));
        sd.setXiiMarksPercentage(d.getXiiMarksPercentage());
        sd.setXiiYearOfPassing(d.getXiiYearOfPassing());
        sd.setXiiSchoolName(trim(d.getXiiSchoolName()));
        sd.setXiiBoardOfStudy(trim(d.getXiiBoardOfStudy()));
        sd.setXiiCutOffMarks(d.getXiiCutOffMarks());
        sd.setDiplomaMarksPercentage(d.getDiplomaMarksPercentage());
        markProfileDirty(p);
        studentProfileRepository.save(p);
    }

    /* ════════════════════════════════════════════════════
       TAB 5 — Professional Profile
    ════════════════════════════════════════════════════ */
    @Transactional
    public void updateProfessionalProfile(String email, StudentProfileDto.ProfessionalProfileDto d) {
        StudentProfile p = getEditableProfile(email);
        ProfessionalProfile pp = p.getProfessionalProfile();
        if (pp == null) {
            pp = new ProfessionalProfile();
            pp.setId(p.getId());
            pp.setStudentProfile(p);
            p.setProfessionalProfile(pp);
        }
        pp.setLinkedinProfileUrl(trim(d.getLinkedinProfileUrl()));
        pp.setGithubProfileUrl(trim(d.getGithubProfileUrl()));
        pp.setPortfolioUrl(trim(d.getPortfolioUrl()));
        pp.setLeetcodeProfileUrl(trim(d.getLeetcodeProfileUrl()));
        pp.setLeetcodeProblemsSolved(d.getLeetcodeProblemsSolved());
        pp.setLeetcodeRating(trim(d.getLeetcodeRating()));
        pp.setHackerrankProfileUrl(trim(d.getHackerrankProfileUrl()));
        pp.setCodechefProfileUrl(trim(d.getCodechefProfileUrl()));
        pp.setCodeforcesProfileUrl(trim(d.getCodeforcesProfileUrl()));
        markProfileDirty(p);
        studentProfileRepository.save(p);
    }

    /* ════════════════════════════════════════════════════
       TAB 6 — Certifications (replace-all strategy)
    ════════════════════════════════════════════════════ */
    @Transactional
    public void updateCertifications(String email, java.util.List<StudentProfileDto.CertificationDto> dtos) {
        // Use dedicated fetch that JOINs certifications to avoid LazyInitializationException on .clear()
        StudentProfile p = studentProfileRepository.findProfileWithCertificationsByUserEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Profile not found for: " + email));
        if (Boolean.TRUE.equals(p.getIsLocked())) {
            throw new ProfileLockedException("Profile is locked and cannot be edited");
        }
        if (p.getVerificationStatus() == VerificationStatus.VERIFIED) {
            throw new ProfileLockedException("Verified profile cannot be edited");
        }
        p.getCertifications().clear();
        if (dtos != null) {
            for (StudentProfileDto.CertificationDto d : dtos) {
                if (d.getSkillName() == null || d.getSkillName().isBlank()) continue;
                Certification c = new Certification();
                c.setStudentProfile(p);
                c.setSkillName(trim(d.getSkillName()));
                c.setDuration(trim(d.getDuration()));
                c.setVendor(trim(d.getVendor()));
                p.getCertifications().add(c);
            }
        }
        markProfileDirty(p);
        studentProfileRepository.save(p);
    }

    /* ════════════════════════════════════════════════════
       TAB 7 — Identity Documents
    ════════════════════════════════════════════════════ */
    @Transactional
    public void updateIdentityDocs(String email, StudentProfileDto.IdentityDocsDto d) {
        StudentProfile p = getEditableProfile(email);
        IdentityDocs id = p.getIdentityDocs();
        if (id == null) {
            id = new IdentityDocs();
            id.setId(p.getId());
            id.setStudentProfile(p);
            p.setIdentityDocs(id);
        }
        id.setIsAadharAvailable(Boolean.TRUE.equals(d.getIsAadharAvailable()));
        id.setAadharNumber(trim(d.getAadharNumber()));
        id.setNameAsPerAadhar(trim(d.getNameAsPerAadhar()));
        id.setFamilyCardNumber(trim(d.getFamilyCardNumber()));
        id.setIsPanCardAvailable(Boolean.TRUE.equals(d.getIsPanCardAvailable()));
        id.setIsPassportAvailable(Boolean.TRUE.equals(d.getIsPassportAvailable()));
        markProfileDirty(p);
        studentProfileRepository.save(p);
    }

    /* ════════════════════════════════════════════════════
       TAB — Skills (replace-all strategy)
    ════════════════════════════════════════════════════ */
    @Transactional
    public void updateSkills(String email, java.util.List<StudentProfileDto.SkillDto> dtos) {
        // Use dedicated fetch that JOINs skills to avoid LazyInitializationException on .clear()
        StudentProfile p = studentProfileRepository.findProfileWithSkillsByUserEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Profile not found for: " + email));
        if (Boolean.TRUE.equals(p.getIsLocked())) {
            throw new ProfileLockedException("Profile is locked and cannot be edited");
        }
        if (p.getVerificationStatus() == VerificationStatus.VERIFIED) {
            throw new ProfileLockedException("Verified profile cannot be edited");
        }
        p.getSkills().clear();
        if (dtos != null) {
            for (StudentProfileDto.SkillDto d : dtos) {
                if (d.getSkillName() == null || d.getSkillName().isBlank()) continue;
                StudentSkill s = new StudentSkill();
                s.setStudentProfile(p);
                s.setSkillName(trim(d.getSkillName()));
                s.setProficiencyLevel(trim(d.getProficiencyLevel()) != null ? trim(d.getProficiencyLevel()) : "Intermediate");
                s.setCategory(trim(d.getCategory()) != null ? trim(d.getCategory()) : "Technical");
                p.getSkills().add(s);
            }
        }
        markProfileDirty(p);
        studentProfileRepository.save(p);
    }

    /* ════════════════════════════════════════════════════
       TAB — Resume Details
    ════════════════════════════════════════════════════ */
    @Transactional
    public void updateResume(String email, StudentProfileDto.ResumeDto d) {
        StudentProfile p = getEditableProfile(email);
        p.setResumeUrl(trim(d.getResumeUrl()));
        p.setResumeFileName(trim(d.getResumeFileName()));
        // Always set upload timestamp to now when resume is saved
        p.setResumeUploadedAt(java.time.LocalDateTime.now());
        p.setResumeSummary(trim(d.getResumeSummary()));
        markProfileDirty(p);
        studentProfileRepository.save(p);
    }

    
    public Double calculateCompletionPercentage(StudentProfile profile) {
        if (profile == null) return 0.0;
        
        double totalSections = 7.0;
        double completedSections = 0.0;
        
        if (profile.getPersonalDetails() != null && profile.getPersonalDetails().getFirstName() != null) completedSections++;
        if (profile.getContactDetails() != null && profile.getContactDetails().getStudentMobile1() != null) completedSections++;
        if (profile.getAcademicRecord() != null && profile.getAcademicRecord().getCgpa() != null) completedSections++;
        if (profile.getSchoolingDetails() != null && profile.getSchoolingDetails().getXMarksPercentage() != null) completedSections++;
        if (profile.getProfessionalProfile() != null && profile.getProfessionalProfile().getLinkedinProfileUrl() != null) completedSections++;
        if (profile.getCertifications() != null && !profile.getCertifications().isEmpty()) completedSections++;
        if (profile.getResumeUrl() != null && !profile.getResumeUrl().isEmpty()) completedSections++;
        
        return (completedSections / totalSections) * 100.0;
    }

    /* ── Utility: convert empty string → null for optional text fields ── */
    private String trim(String s) {
        if (s == null) return null;
        String t = s.trim();
        return t.isEmpty() ? null : t;
    }

    private void markProfileDirty(StudentProfile profile) {
        // Reset verification when student edits their profile; admin/faculty will re-verify
        if (profile.getVerificationStatus() != VerificationStatus.VERIFIED) {
            profile.setVerificationStatus(VerificationStatus.PENDING);
        }
        profile.setIsEligibleForPlacements(false);
        profile.setEligibleForAdminReview(false);
    }
}
