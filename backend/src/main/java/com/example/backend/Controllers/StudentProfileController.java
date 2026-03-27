package com.example.backend.Controllers;

import com.example.backend.DTOs.StudentProfileDto;
import com.example.backend.Services.StudentProfileService;
import com.example.backend.Utils.ApiResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/student/profile")
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
public class StudentProfileController {

    @Autowired
    private StudentProfileService studentProfileService;

    @GetMapping
    public ResponseEntity<ApiResponse<StudentProfileDto>> getMyProfile(@RequestParam String email) {
        return ResponseEntity.ok(ApiResponse.success("Profile fetched successfully",
                studentProfileService.getProfileByEmail(email)));
    }

    @GetMapping("/verification-status")
    public ResponseEntity<ApiResponse<String>> getVerificationStatus(@RequestParam String email) {
        return ResponseEntity.ok(ApiResponse.success("Status fetched",
                studentProfileService.getVerificationStatus(email)));
    }

    @PostMapping("/submit")
    public ResponseEntity<ApiResponse<Void>> submitProfileForVerification(@RequestParam String email) {
        studentProfileService.submitProfileForVerification(email);
        return ResponseEntity.ok(ApiResponse.success("Profile submitted to faculty for verification", null));
    }

    @PutMapping("/personal")
    public ResponseEntity<ApiResponse<Void>> updatePersonalDetails(
            @RequestParam String email,
            @RequestBody StudentProfileDto.PersonalDetailsDto details) {
        studentProfileService.updatePersonalDetails(email, details);
        return ResponseEntity.ok(ApiResponse.success("Personal details updated", null));
    }

    @PutMapping("/contact")
    public ResponseEntity<ApiResponse<Void>> updateContactDetails(
            @RequestParam String email,
            @RequestBody StudentProfileDto.ContactDetailsDto details) {
        studentProfileService.updateContactDetails(email, details);
        return ResponseEntity.ok(ApiResponse.success("Contact details updated", null));
    }

    @PutMapping("/academic")
    public ResponseEntity<ApiResponse<Void>> updateAcademicRecord(
            @RequestParam String email,
            @RequestBody StudentProfileDto.AcademicRecordDto details) {
        studentProfileService.updateAcademicRecord(email, details);
        return ResponseEntity.ok(ApiResponse.success("Academic record updated", null));
    }

    @PutMapping("/schooling")
    public ResponseEntity<ApiResponse<Void>> updateSchoolingDetails(
            @RequestParam String email,
            @RequestBody StudentProfileDto.SchoolingDetailsDto details) {
        studentProfileService.updateSchoolingDetails(email, details);
        return ResponseEntity.ok(ApiResponse.success("Schooling details updated", null));
    }

    @PutMapping("/professional")
    public ResponseEntity<ApiResponse<Void>> updateProfessionalProfile(
            @RequestParam String email,
            @RequestBody StudentProfileDto.ProfessionalProfileDto details) {
        studentProfileService.updateProfessionalProfile(email, details);
        return ResponseEntity.ok(ApiResponse.success("Professional profile updated", null));
    }

    @PutMapping("/certifications")
    public ResponseEntity<ApiResponse<Void>> updateCertifications(
            @RequestParam String email,
            @RequestBody List<StudentProfileDto.CertificationDto> certifications) {
        studentProfileService.updateCertifications(email, certifications);
        return ResponseEntity.ok(ApiResponse.success("Certifications updated", null));
    }

    @PutMapping("/identity")
    public ResponseEntity<ApiResponse<Void>> updateIdentityDocs(
            @RequestParam String email,
            @RequestBody StudentProfileDto.IdentityDocsDto details) {
        studentProfileService.updateIdentityDocs(email, details);
        return ResponseEntity.ok(ApiResponse.success("Identity documents updated", null));
    }

    @PutMapping("/skills")
    public ResponseEntity<ApiResponse<Void>> updateSkills(
            @RequestParam String email,
            @RequestBody List<StudentProfileDto.SkillDto> skills) {
        studentProfileService.updateSkills(email, skills);
        return ResponseEntity.ok(ApiResponse.success("Skills updated", null));
    }

    @PutMapping("/resume")
    public ResponseEntity<ApiResponse<Void>> updateResume(
            @RequestParam String email,
            @RequestBody StudentProfileDto.ResumeDto details) {
        studentProfileService.updateResume(email, details);
        return ResponseEntity.ok(ApiResponse.success("Resume details updated", null));
    }
}
