package com.example.backend.Controllers;

import com.example.backend.DTOs.StudentProfileDto;
import com.example.backend.Services.StudentProfileService;
import com.example.backend.Utils.ApiResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/student/profile")
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
public class StudentProfileController {

    @Autowired
    private StudentProfileService studentProfileService;

    private String resolveStudentEmail(String email, Authentication authentication) {
        if (authentication != null && authentication.getName() != null && !authentication.getName().isBlank()) {
            return authentication.getName();
        }
        if (email != null && !email.isBlank()) {
            return email;
        }
        throw new IllegalArgumentException("Student email could not be resolved from the current session");
    }

    @GetMapping
    public ResponseEntity<ApiResponse<StudentProfileDto>> getMyProfile(
            @RequestParam(required = false) String email,
            Authentication authentication) {
        return ResponseEntity.ok(ApiResponse.success("Profile fetched successfully",
                studentProfileService.getProfileByEmail(resolveStudentEmail(email, authentication))));
    }

    @GetMapping("/verification-status")
    public ResponseEntity<ApiResponse<String>> getVerificationStatus(
            @RequestParam(required = false) String email,
            Authentication authentication) {
        return ResponseEntity.ok(ApiResponse.success("Status fetched",
                studentProfileService.getVerificationStatus(resolveStudentEmail(email, authentication))));
    }

    @PostMapping("/submit")
    public ResponseEntity<ApiResponse<Void>> submitProfileForVerification(
            @RequestParam(required = false) String email,
            Authentication authentication) {
        studentProfileService.submitProfileForVerification(resolveStudentEmail(email, authentication));
        return ResponseEntity.ok(ApiResponse.success("Profile submitted to faculty for verification", null));
    }

    @PutMapping("/personal")
    public ResponseEntity<ApiResponse<Void>> updatePersonalDetails(
            @RequestParam(required = false) String email,
            Authentication authentication,
            @RequestBody StudentProfileDto.PersonalDetailsDto details) {
        studentProfileService.updatePersonalDetails(resolveStudentEmail(email, authentication), details);
        return ResponseEntity.ok(ApiResponse.success("Personal details updated", null));
    }

    @PutMapping("/contact")
    public ResponseEntity<ApiResponse<Void>> updateContactDetails(
            @RequestParam(required = false) String email,
            Authentication authentication,
            @RequestBody StudentProfileDto.ContactDetailsDto details) {
        studentProfileService.updateContactDetails(resolveStudentEmail(email, authentication), details);
        return ResponseEntity.ok(ApiResponse.success("Contact details updated", null));
    }

    @PutMapping("/academic")
    public ResponseEntity<ApiResponse<Void>> updateAcademicRecord(
            @RequestParam(required = false) String email,
            Authentication authentication,
            @RequestBody StudentProfileDto.AcademicRecordDto details) {
        studentProfileService.updateAcademicRecord(resolveStudentEmail(email, authentication), details);
        return ResponseEntity.ok(ApiResponse.success("Academic record updated", null));
    }

    @PutMapping("/schooling")
    public ResponseEntity<ApiResponse<Void>> updateSchoolingDetails(
            @RequestParam(required = false) String email,
            Authentication authentication,
            @RequestBody StudentProfileDto.SchoolingDetailsDto details) {
        studentProfileService.updateSchoolingDetails(resolveStudentEmail(email, authentication), details);
        return ResponseEntity.ok(ApiResponse.success("Schooling details updated", null));
    }

    @PutMapping("/professional")
    public ResponseEntity<ApiResponse<Void>> updateProfessionalProfile(
            @RequestParam(required = false) String email,
            Authentication authentication,
            @RequestBody StudentProfileDto.ProfessionalProfileDto details) {
        studentProfileService.updateProfessionalProfile(resolveStudentEmail(email, authentication), details);
        return ResponseEntity.ok(ApiResponse.success("Professional profile updated", null));
    }

    @PutMapping("/certifications")
    public ResponseEntity<ApiResponse<Void>> updateCertifications(
            @RequestParam(required = false) String email,
            Authentication authentication,
            @RequestBody List<StudentProfileDto.CertificationDto> certifications) {
        studentProfileService.updateCertifications(resolveStudentEmail(email, authentication), certifications);
        return ResponseEntity.ok(ApiResponse.success("Certifications updated", null));
    }

    @PutMapping("/identity")
    public ResponseEntity<ApiResponse<Void>> updateIdentityDocs(
            @RequestParam(required = false) String email,
            Authentication authentication,
            @RequestBody StudentProfileDto.IdentityDocsDto details) {
        studentProfileService.updateIdentityDocs(resolveStudentEmail(email, authentication), details);
        return ResponseEntity.ok(ApiResponse.success("Identity documents updated", null));
    }

    @PutMapping("/skills")
    public ResponseEntity<ApiResponse<Void>> updateSkills(
            @RequestParam(required = false) String email,
            Authentication authentication,
            @RequestBody List<StudentProfileDto.SkillDto> skills) {
        studentProfileService.updateSkills(resolveStudentEmail(email, authentication), skills);
        return ResponseEntity.ok(ApiResponse.success("Skills updated", null));
    }

    @PutMapping("/resume")
    public ResponseEntity<ApiResponse<Void>> updateResume(
            @RequestParam(required = false) String email,
            Authentication authentication,
            @RequestBody StudentProfileDto.ResumeDto details) {
        studentProfileService.updateResume(resolveStudentEmail(email, authentication), details);
        return ResponseEntity.ok(ApiResponse.success("Resume details updated", null));
    }
}
