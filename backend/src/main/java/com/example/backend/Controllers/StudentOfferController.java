package com.example.backend.Controllers;

import com.example.backend.DTOs.StudentOfferDTO;
import com.example.backend.Services.StudentOfferService;
import com.example.backend.Utils.ApiResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/student/offers")
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
public class StudentOfferController {

    @Autowired
    private StudentOfferService studentOfferService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<StudentOfferDTO>>> getMyOffers(@RequestParam String email) {
        return ResponseEntity.ok(
                ApiResponse.success("Offers fetched successfully", studentOfferService.getMyOffers(email))
        );
    }
}
