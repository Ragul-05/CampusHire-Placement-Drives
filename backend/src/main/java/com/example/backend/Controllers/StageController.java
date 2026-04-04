package com.example.backend.Controllers;

import com.example.backend.DTOs.Faculty.FacultyStageUpdateRequestDTO;
import com.example.backend.Services.StageUpdateService;
import com.example.backend.Utils.ApiResponse;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/stage")
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
public class StageController {

    @Autowired
    private StageUpdateService stageUpdateService;

    private String resolveActorEmail(String email, String facultyEmail, Authentication authentication) {
        if (authentication != null && authentication.getName() != null && !authentication.getName().isBlank()) {
            return authentication.getName();
        }
        if (email != null && !email.isBlank()) {
            return email;
        }
        if (facultyEmail != null && !facultyEmail.isBlank()) {
            return facultyEmail;
        }
        throw new IllegalArgumentException("User email could not be resolved from the current session");
    }

    @PutMapping("/update")
    public ResponseEntity<ApiResponse<Void>> updateStage(
            @Valid @RequestBody FacultyStageUpdateRequestDTO request,
            @RequestParam(required = false) String email,
            @RequestParam(required = false) String facultyEmail,
            Authentication authentication) {

        stageUpdateService.updateStage(
                request.getStudentId(),
                request.getDriveId(),
                request.getStage(),
                resolveActorEmail(email, facultyEmail, authentication));

        return ResponseEntity.ok(ApiResponse.success("Stage updated successfully", null));
    }
}
