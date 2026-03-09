package com.example.backend.Controllers;

import com.example.backend.AOPs.AuditAction;
import com.example.backend.Models.Announcement;
import com.example.backend.Models.Event;
import com.example.backend.Services.FacultyAnnouncementService;
import com.example.backend.Utils.ApiResponse;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/faculty")
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
public class FacultyAnnouncementController {

    @Autowired
    private FacultyAnnouncementService facultyAnnouncementService;

    @AuditAction(action = "VIEW_DEPARTMENT_ANNOUNCEMENTS", targetEntity = "ANNOUNCEMENT")
    @GetMapping("/announcements")
    public ResponseEntity<ApiResponse<List<Announcement>>> getAnnouncements(
            @RequestParam(required = false, defaultValue = "faculty@dept.com") String facultyEmail) {

        List<Announcement> announcements = facultyAnnouncementService.getDepartmentAnnouncements(facultyEmail);
        return ResponseEntity.ok(ApiResponse.success("Department announcements retrieved", announcements));
    }

    @AuditAction(action = "CREATE_DEPARTMENT_ANNOUNCEMENT", targetEntity = "ANNOUNCEMENT")
    @PostMapping("/announcements")
    public ResponseEntity<ApiResponse<Announcement>> createAnnouncement(
            @Valid @RequestBody Announcement request,
            @RequestParam(required = false, defaultValue = "faculty@dept.com") String facultyEmail) {

        Announcement created = facultyAnnouncementService.createDepartmentAnnouncement(request, facultyEmail);
        return ResponseEntity.ok(ApiResponse.success("Department announcement created successfully", created));
    }

    @AuditAction(action = "DELETE_DEPARTMENT_ANNOUNCEMENT", targetEntity = "ANNOUNCEMENT")
    @DeleteMapping("/announcements/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteAnnouncement(
            @PathVariable Long id,
            @RequestParam(required = false, defaultValue = "faculty@dept.com") String facultyEmail) {

        facultyAnnouncementService.deleteAnnouncement(id, facultyEmail);
        return ResponseEntity.ok(ApiResponse.success("Department announcement deleted successfully", null));
    }

    @AuditAction(action = "VIEW_DEPARTMENT_EVENTS", targetEntity = "EVENT")
    @GetMapping("/events")
    public ResponseEntity<ApiResponse<List<Event>>> getEvents(
            @RequestParam(required = false, defaultValue = "faculty@dept.com") String facultyEmail) {

        List<Event> events = facultyAnnouncementService.getDepartmentEvents(facultyEmail);
        return ResponseEntity.ok(ApiResponse.success("Department events retrieved", events));
    }

    @AuditAction(action = "CREATE_DEPARTMENT_EVENT", targetEntity = "EVENT")
    @PostMapping("/events")
    public ResponseEntity<ApiResponse<Event>> createEvent(
            @Valid @RequestBody Event request,
            @RequestParam(required = false, defaultValue = "faculty@dept.com") String facultyEmail) {

        Event created = facultyAnnouncementService.createDepartmentEvent(request, facultyEmail);
        return ResponseEntity.ok(ApiResponse.success("Department event created successfully", created));
    }

    @AuditAction(action = "DELETE_DEPARTMENT_EVENT", targetEntity = "EVENT")
    @DeleteMapping("/events/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteEvent(
            @PathVariable Long id,
            @RequestParam(required = false, defaultValue = "faculty@dept.com") String facultyEmail) {

        facultyAnnouncementService.deleteEvent(id, facultyEmail);
        return ResponseEntity.ok(ApiResponse.success("Department event deleted successfully", null));
    }
}
