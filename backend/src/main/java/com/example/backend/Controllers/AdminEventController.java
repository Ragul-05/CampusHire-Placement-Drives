package com.example.backend.Controllers;

import com.example.backend.AOPs.AuditAction;
import com.example.backend.Models.Event;
import com.example.backend.Services.AdminEventService;
import com.example.backend.Utils.ApiResponse;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/events")
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
public class AdminEventController {

    @Autowired
    private AdminEventService adminEventService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<Event>>> getAllEvents() {
        return ResponseEntity.ok(
                ApiResponse.success("Events fetched successfully", adminEventService.getAllEvents()));
    }

    @PostMapping
    @AuditAction(action = "CREATE_EVENT", targetEntity = "Event")
    public ResponseEntity<ApiResponse<Event>> createEvent(@Valid @RequestBody Event request) {
        return ResponseEntity.ok(
                ApiResponse.success("Event created successfully", adminEventService.createEvent(request)));
    }

    @DeleteMapping("/{id}")
    @AuditAction(action = "DELETE_EVENT", targetEntity = "Event")
    public ResponseEntity<ApiResponse<Void>> deleteEvent(@PathVariable Long id) {
        adminEventService.deleteEvent(id);
        return ResponseEntity.ok(ApiResponse.success("Event deleted successfully", null));
    }
}
