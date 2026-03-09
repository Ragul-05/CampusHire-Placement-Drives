package com.example.backend.Controllers;

import com.example.backend.DTOs.StudentAnnouncementDTO;
import com.example.backend.DTOs.StudentEventDTO;
import com.example.backend.Services.StudentAnnouncementService;
import com.example.backend.Utils.ApiResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/student")
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
public class StudentAnnouncementController {

    @Autowired
    private StudentAnnouncementService studentAnnouncementService;

    /** GET /api/student/announcements?email=... */
    @GetMapping("/announcements")
    public ResponseEntity<ApiResponse<List<StudentAnnouncementDTO>>> getAnnouncements(
            @RequestParam String email) {
        return ResponseEntity.ok(
                ApiResponse.success(
                        "Announcements fetched",
                        studentAnnouncementService.getAnnouncementsForStudent(email)));
    }

    /** GET /api/student/events?email=... */
    @GetMapping("/events")
    public ResponseEntity<ApiResponse<List<StudentEventDTO>>> getEvents(
            @RequestParam String email) {
        return ResponseEntity.ok(
                ApiResponse.success(
                        "Events fetched",
                        studentAnnouncementService.getEventsForStudent(email)));
    }
}
