package com.example.backend.Services;

import com.example.backend.DTOs.Faculty.FacultyStudentDTO;
import com.example.backend.DTOs.Faculty.ProfileVerificationRequestDTO;
import com.example.backend.Exceptions.ResourceNotFoundException;
import com.example.backend.Exceptions.UnauthorizedActionException;
import com.example.backend.Models.ProfileVerification;
import com.example.backend.Models.StudentProfile;
import com.example.backend.Models.User;
import com.example.backend.Models.enums.VerificationStatus;
import com.example.backend.Repositories.ProfileVerificationRepository;
import com.example.backend.Repositories.StudentProfileRepository;
import com.example.backend.Repositories.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class FacultyStudentService {

    @Autowired
    private StudentProfileRepository studentProfileRepository;

    @Autowired
    private ProfileVerificationRepository profileVerificationRepository;

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

    public List<FacultyStudentDTO> getDepartmentStudents(String facultyEmail, String statusFilter) {
        User faculty = getAuthenticatedFaculty(facultyEmail);
        Long departmentId = faculty.getDepartment().getId();

        List<StudentProfile> students = studentProfileRepository.findByUserDepartmentId(departmentId);

        if (statusFilter != null && !statusFilter.isEmpty()) {
            final String status = statusFilter.toUpperCase();
            students = students.stream()
                    .filter(s -> {
                        VerificationStatus v = s.getVerificationStatus();
                        String current = v != null ? v.name() : VerificationStatus.PENDING.name();
                        return current.equalsIgnoreCase(status);
                    })
                    .collect(Collectors.toList());
        }

        return students.stream().map(this::mapToDTO).collect(Collectors.toList());
    }

    public FacultyStudentDTO getStudentProfile(Long studentId, String facultyEmail) {
        User faculty = getAuthenticatedFaculty(facultyEmail);
        StudentProfile student = studentProfileRepository.findById(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found"));

        if (!student.getUser().getDepartment().getId().equals(faculty.getDepartment().getId())) {
            throw new UnauthorizedActionException("Cannot access student from another department");
        }

        return mapToDTO(student);
    }

    public void verifyStudentProfile(Long studentId, ProfileVerificationRequestDTO request, String facultyEmail) {
        User faculty = getAuthenticatedFaculty(facultyEmail);
        StudentProfile student = studentProfileRepository.findById(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found"));

        if (!student.getUser().getDepartment().getId().equals(faculty.getDepartment().getId())) {
            throw new UnauthorizedActionException("Cannot verify student from another department");
        }

        if (request.getStatus() == VerificationStatus.REJECTED
                && (request.getRemarks() == null || request.getRemarks().trim().isEmpty())) {
            throw new IllegalArgumentException("Remarks are mandatory when rejecting a profile");
        }

        student.setVerificationStatus(request.getStatus());
        // Only mark eligible when verified; reset otherwise
        if (request.getStatus() == VerificationStatus.VERIFIED) {
            student.setIsEligibleForPlacements(true);
            student.setEligibleForAdminReview(false);
        } else {
            student.setIsEligibleForPlacements(false);
            student.setEligibleForAdminReview(false);
        }
        studentProfileRepository.save(student);

        // Record verification history
        ProfileVerification verification = ProfileVerification.builder()
                .studentProfile(student)
                .faculty(faculty)
                .status(request.getStatus())
                .remarks(request.getRemarks())
                .verifiedAt(LocalDateTime.now())
                .build();

        profileVerificationRepository.save(verification);
    }

    public void sendStudentToAdmin(Long studentId, String facultyEmail) {
        User faculty = getAuthenticatedFaculty(facultyEmail);
        StudentProfile student = studentProfileRepository.findById(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found"));

        if (!student.getUser().getDepartment().getId().equals(faculty.getDepartment().getId())) {
            throw new UnauthorizedActionException("Cannot send student from another department");
        }
        if (student.getVerificationStatus() != VerificationStatus.VERIFIED) {
            throw new IllegalArgumentException("Only verified profiles can be sent to admin");
        }

        student.setEligibleForAdminReview(true);
        studentProfileRepository.save(student);
    }

    public List<ProfileVerification> getVerificationHistory(String facultyEmail) {
        User faculty = getAuthenticatedFaculty(facultyEmail);
        return profileVerificationRepository.findByFacultyId(faculty.getId());
    }

    private FacultyStudentDTO mapToDTO(StudentProfile s) {
        return FacultyStudentDTO.builder()
                .id(s.getId())
                .userId(s.getUser().getId())
                .rollNo(s.getRollNo())
                .batch(s.getBatch())
                .name(s.getUser().getEmail()) // Defaulting to email as name if missing name
                .email(s.getUser().getEmail())
                .verificationStatus(s.getVerificationStatus() != null ? s.getVerificationStatus().name() : "PENDING")
                .isLocked(s.getIsLocked() != null ? s.getIsLocked() : false)
                .isEligibleForPlacements(
                        s.getIsEligibleForPlacements() != null ? s.getIsEligibleForPlacements() : false)
                .eligibleForAdminReview(s.getEligibleForAdminReview() != null ? s.getEligibleForAdminReview() : false)
                .isPlaced(s.getIsPlaced() != null ? s.getIsPlaced() : false)
                .numberOfOffers(s.getNumberOfOffers() != null ? s.getNumberOfOffers() : 0)
                .highestPackageLpa(s.getHighestPackageLpa() != null ? s.getHighestPackageLpa() : 0.0)
                .cgpa(s.getAcademicRecord() != null ? s.getAcademicRecord().getCgpa() : null)
                .standingArrears(s.getAcademicRecord() != null ? s.getAcademicRecord().getStandingArrears() : 0)
                .historyOfArrears(s.getAcademicRecord() != null ? s.getAcademicRecord().getHistoryOfArrears() : 0)
                .build();
    }
}
