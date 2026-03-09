package com.example.backend.Controllers;

import com.example.backend.Models.Announcement;
import com.example.backend.Models.Company;
import com.example.backend.Models.Event;
import com.example.backend.Services.InformationService;
import com.example.backend.Utils.ApiResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/student/info")
public class InformationController {

    @Autowired
    private InformationService informationService;

    @GetMapping("/companies")
    public ResponseEntity<ApiResponse<List<Company>>> getCompanies() {
        return ResponseEntity.ok(ApiResponse.success("Companies fetched", informationService.getAllCompanies()));
    }

    @GetMapping("/announcements")
    public ResponseEntity<ApiResponse<List<Announcement>>> getAnnouncements() {
        return ResponseEntity.ok(ApiResponse.success("Announcements fetched", informationService.getAnnouncements()));
    }

    @GetMapping("/events")
    public ResponseEntity<ApiResponse<List<Event>>> getEvents() {
        return ResponseEntity.ok(ApiResponse.success("Events fetched", informationService.getEvents()));
    }
}
