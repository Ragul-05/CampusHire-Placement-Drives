package com.example.backend.Services;

import com.example.backend.DTOs.Admin.AdminStudentProfileDTO;
import com.example.backend.Exceptions.ResourceNotFoundException;
import com.example.backend.Models.StudentProfile;
import com.example.backend.Repositories.StudentProfileRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class AdminStudentService {
    @Autowired
    private StudentProfileRepository studentProfileRepository;

    public List<AdminStudentProfileDTO> searchVerifiedStudents(String query) {
        return studentProfileRepository.searchVerifiedStudents(query)
                .stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    public List<AdminStudentProfileDTO> getEligibleForAdminReview() {
        return studentProfileRepository.findByVerificationStatusAndEligibleForAdminReviewTrue(
                        com.example.backend.Models.enums.VerificationStatus.VERIFIED)
                .stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    public AdminStudentProfileDTO toggleProfileLock(Long studentId) {
        StudentProfile profile = studentProfileRepository.findById(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found"));

        Boolean currentLock = profile.getIsLocked() != null ? profile.getIsLocked() : false;
        profile.setIsLocked(!currentLock);

        profile = studentProfileRepository.save(profile);
        return mapToDTO(profile);
    }

    public AdminStudentProfileDTO getStudentById(Long studentId) {
        StudentProfile profile = studentProfileRepository.findById(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found"));
        return mapToDTO(profile);
    }

    private AdminStudentProfileDTO mapToDTO(StudentProfile profile) {
        return AdminStudentProfileDTO.builder()
                .id(profile.getId())
                .email(profile.getUser() != null ? profile.getUser().getEmail() : null)
                .rollNo(profile.getRollNo())
                .batch(profile.getBatch())
                .departmentName((profile.getUser() != null && profile.getUser().getDepartment() != null)
                        ? profile.getUser().getDepartment().getName()
                        : null)
                .verificationStatus(profile.getVerificationStatus())
                .isLocked(profile.getIsLocked() != null ? profile.getIsLocked() : false)
                .isPlaced(profile.getIsPlaced() != null ? profile.getIsPlaced() : false)
                .eligibleForAdminReview(profile.getEligibleForAdminReview() != null ? profile.getEligibleForAdminReview() : false)
                .highestPackageLpa(profile.getHighestPackageLpa())
                .resumeUrl(profile.getResumeUrl())
                .build();
    }
}
