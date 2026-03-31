package com.example.backend.Mappers;

import com.example.backend.DTOs.StudentProfileDto;
import com.example.backend.Models.*;

import java.util.Collections;
import java.util.stream.Collectors;

public class StudentMapper {

    public static StudentProfileDto toDto(StudentProfile profile) {
        if (profile == null) return null;

        StudentProfileDto dto = StudentProfileDto.builder()
                .id(profile.getId())
                .rollNo(profile.getRollNo())
                .batch(profile.getBatch())
                .resumeUrl(profile.getResumeUrl())
                .resumeFileName(profile.getResumeFileName())
                .resumeUploadedAt(profile.getResumeUploadedAt())
                .resumeSummary(profile.getResumeSummary())
                .verificationStatus(profile.getVerificationStatus() != null ? profile.getVerificationStatus().name() : null)
                .submittedForVerification(profile.getSubmittedForVerification())
                .isLocked(profile.getIsLocked())
                .isEligibleForPlacements(profile.getIsEligibleForPlacements())
                .interestedOnPlacement(profile.getInterestedOnPlacement())
                .isPlaced(profile.getIsPlaced())
                .numberOfOffers(profile.getNumberOfOffers())
                .highestPackageLpa(profile.getHighestPackageLpa())
                .build();

        // User fields (registerNumber, email, department)
        if (profile.getUser() != null) {
            dto.setRegisterNumber(profile.getUser().getUniversityRegNo());
            dto.setEmail(profile.getUser().getEmail());
            if (profile.getUser().getDepartment() != null) {
                dto.setDepartmentName(profile.getUser().getDepartment().getName());
            }
        }

        // Resume grouped DTO
        StudentProfileDto.ResumeDto resumeDto = new StudentProfileDto.ResumeDto();
        resumeDto.setResumeUrl(profile.getResumeUrl());
        resumeDto.setResumeFileName(profile.getResumeFileName());
        resumeDto.setResumeUploadedAt(profile.getResumeUploadedAt());
        resumeDto.setResumeSummary(profile.getResumeSummary());
        dto.setResume(resumeDto);

        // 1. Personal Details
        if (profile.getPersonalDetails() != null) {
            PersonalDetails pd = profile.getPersonalDetails();
            StudentProfileDto.PersonalDetailsDto pdDto = new StudentProfileDto.PersonalDetailsDto();
            pdDto.setFirstName(pd.getFirstName());
            pdDto.setLastName(pd.getLastName());
            pdDto.setFatherName(pd.getFatherName());
            pdDto.setMotherName(pd.getMotherName());
            pdDto.setFatherOccupation(pd.getFatherOccupation());
            pdDto.setMotherOccupation(pd.getMotherOccupation());
            pdDto.setGender(pd.getGender());
            pdDto.setCommunity(pd.getCommunity());
            pdDto.setDateOfBirth(pd.getDateOfBirth());
            pdDto.setHostelerOrDayScholar(pd.getHostelerOrDayScholar());
            pdDto.setBio(pd.getBio());
            dto.setPersonalDetails(pdDto);
        }

        // 2. Contact Details
        if (profile.getContactDetails() != null) {
            ContactDetails cd = profile.getContactDetails();
            StudentProfileDto.ContactDetailsDto cdDto = new StudentProfileDto.ContactDetailsDto();
            cdDto.setAlternateEmail(cd.getAlternateEmail());
            cdDto.setStudentMobile1(cd.getStudentMobile1());
            cdDto.setStudentMobile2(cd.getStudentMobile2());
            cdDto.setParentMobile(cd.getParentMobile());
            cdDto.setLandlineNo(cd.getLandlineNo());
            cdDto.setFullAddress(cd.getFullAddress());
            cdDto.setCity(cd.getCity());
            cdDto.setState(cd.getState());
            cdDto.setPincode(cd.getPincode());
            dto.setContactDetails(cdDto);
        }

        // 3. Academic Record
        if (profile.getAcademicRecord() != null) {
            AcademicRecord ar = profile.getAcademicRecord();
            StudentProfileDto.AcademicRecordDto arDto = new StudentProfileDto.AcademicRecordDto();
            arDto.setDepartmentCode(
                    profile.getUser() != null && profile.getUser().getDepartment() != null
                            ? profile.getUser().getDepartment().getCode()
                            : null);
            arDto.setUgYearOfPass(ar.getUgYearOfPass());
            arDto.setAdmissionQuota(ar.getAdmissionQuota());
            arDto.setMediumOfInstruction(ar.getMediumOfInstruction());
            arDto.setLocality(ar.getLocality());
            arDto.setSem1Gpa(ar.getSem1Gpa()); arDto.setSem2Gpa(ar.getSem2Gpa());
            arDto.setSem3Gpa(ar.getSem3Gpa()); arDto.setSem4Gpa(ar.getSem4Gpa());
            arDto.setSem5Gpa(ar.getSem5Gpa()); arDto.setSem6Gpa(ar.getSem6Gpa());
            arDto.setSem7Gpa(ar.getSem7Gpa()); arDto.setSem8Gpa(ar.getSem8Gpa());
            arDto.setCgpa(ar.getCgpa());
            arDto.setStandingArrears(ar.getStandingArrears());
            arDto.setHistoryOfArrears(ar.getHistoryOfArrears());
            arDto.setHasHistoryOfArrears(ar.getHasHistoryOfArrears());
            arDto.setCourseGapInYears(ar.getCourseGapInYears());
            dto.setAcademicRecord(arDto);
        }

        // 4. Schooling Details
        if (profile.getSchoolingDetails() != null) {
            SchoolingDetails sd = profile.getSchoolingDetails();
            StudentProfileDto.SchoolingDetailsDto sdDto = new StudentProfileDto.SchoolingDetailsDto();
            sdDto.setXMarksPercentage(sd.getXMarksPercentage());
            sdDto.setXYearOfPassing(sd.getXYearOfPassing());
            sdDto.setXSchoolName(sd.getXSchoolName());
            sdDto.setXBoardOfStudy(sd.getXBoardOfStudy());
            sdDto.setXiiMarksPercentage(sd.getXiiMarksPercentage());
            sdDto.setXiiYearOfPassing(sd.getXiiYearOfPassing());
            sdDto.setXiiSchoolName(sd.getXiiSchoolName());
            sdDto.setXiiBoardOfStudy(sd.getXiiBoardOfStudy());
            sdDto.setXiiCutOffMarks(sd.getXiiCutOffMarks());
            sdDto.setDiplomaMarksPercentage(sd.getDiplomaMarksPercentage());
            dto.setSchoolingDetails(sdDto);
        }

        // 5. Professional Profile
        if (profile.getProfessionalProfile() != null) {
            ProfessionalProfile pp = profile.getProfessionalProfile();
            StudentProfileDto.ProfessionalProfileDto ppDto = new StudentProfileDto.ProfessionalProfileDto();
            ppDto.setLinkedinProfileUrl(pp.getLinkedinProfileUrl());
            ppDto.setGithubProfileUrl(pp.getGithubProfileUrl());
            ppDto.setPortfolioUrl(pp.getPortfolioUrl());
            ppDto.setLeetcodeProfileUrl(pp.getLeetcodeProfileUrl());
            ppDto.setLeetcodeProblemsSolved(pp.getLeetcodeProblemsSolved());
            ppDto.setLeetcodeRating(pp.getLeetcodeRating());
            ppDto.setHackerrankProfileUrl(pp.getHackerrankProfileUrl());
            ppDto.setCodechefProfileUrl(pp.getCodechefProfileUrl());
            ppDto.setCodeforcesProfileUrl(pp.getCodeforcesProfileUrl());
            dto.setProfessionalProfile(ppDto);
        }

        // 6. Certifications
        if (profile.getCertifications() != null && !profile.getCertifications().isEmpty()) {
            dto.setCertifications(profile.getCertifications().stream().map(c -> {
                StudentProfileDto.CertificationDto cDto = new StudentProfileDto.CertificationDto();
                cDto.setId(c.getId());
                cDto.setSkillName(c.getSkillName());
                cDto.setDuration(c.getDuration());
                cDto.setVendor(c.getVendor());
                return cDto;
            }).collect(Collectors.toList()));
        } else {
            dto.setCertifications(Collections.emptyList());
        }

        // 7. Skills
        if (profile.getSkills() != null && !profile.getSkills().isEmpty()) {
            dto.setSkills(profile.getSkills().stream().map(s -> {
                StudentProfileDto.SkillDto sDto = new StudentProfileDto.SkillDto();
                sDto.setId(s.getId());
                sDto.setSkillName(s.getSkillName());
                sDto.setProficiencyLevel(s.getProficiencyLevel());
                sDto.setCategory(s.getCategory());
                return sDto;
            }).collect(Collectors.toList()));
        } else {
            dto.setSkills(Collections.emptyList());
        }

        // 8. Identity Docs
        if (profile.getIdentityDocs() != null) {
            IdentityDocs id = profile.getIdentityDocs();
            StudentProfileDto.IdentityDocsDto idDto = new StudentProfileDto.IdentityDocsDto();
            idDto.setIsAadharAvailable(id.getIsAadharAvailable());
            idDto.setAadharNumber(id.getAadharNumber());
            idDto.setNameAsPerAadhar(id.getNameAsPerAadhar());
            idDto.setFamilyCardNumber(id.getFamilyCardNumber());
            idDto.setIsPanCardAvailable(id.getIsPanCardAvailable());
            idDto.setIsPassportAvailable(id.getIsPassportAvailable());
            dto.setIdentityDocs(idDto);
        }

        return dto;
    }
}
