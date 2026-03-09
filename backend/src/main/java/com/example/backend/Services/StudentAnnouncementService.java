package com.example.backend.Services;

import com.example.backend.DTOs.StudentAnnouncementDTO;
import com.example.backend.DTOs.StudentEventDTO;
import com.example.backend.Exceptions.ResourceNotFoundException;
import com.example.backend.Models.Announcement;
import com.example.backend.Models.Event;
import com.example.backend.Models.User;
import com.example.backend.Models.enums.AnnouncementScope;
import com.example.backend.Models.enums.Role;
import com.example.backend.Repositories.AnnouncementRepository;
import com.example.backend.Repositories.EventRepository;
import com.example.backend.Repositories.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class StudentAnnouncementService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AnnouncementRepository announcementRepository;

    @Autowired
    private EventRepository eventRepository;

    /**
     * Returns ALL announcements visible to the student:
     *  - GLOBAL ones posted by Placement Head
     *  - DEPARTMENT ones posted by Faculty of the student's own department
     * Sorted newest first.
     */
    @Transactional(readOnly = true)
    public List<StudentAnnouncementDTO> getAnnouncementsForStudent(String email) {
        User student = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found: " + email));

        Long deptId = student.getDepartment() != null ? student.getDepartment().getId() : null;

        List<Announcement> announcements;
        if (deptId != null) {
            // Fetch GLOBAL + this department's DEPARTMENT-scoped announcements
            announcements = announcementRepository.findVisibleToStudent(deptId, AnnouncementScope.GLOBAL);
        } else {
            // Student has no department — show only GLOBAL announcements
            announcements = announcementRepository.findAllGlobalAnnouncements();
        }

        return announcements.stream()
                .map(this::mapAnnouncement)
                .collect(Collectors.toList());
    }

    /**
     * Returns events visible to the student:
     *  - Global events (no department set)
     *  - Department events for the student's department
     * Sorted by scheduledAt ascending (upcoming first).
     */
    @Transactional(readOnly = true)
    public List<StudentEventDTO> getEventsForStudent(String email) {
        User student = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found: " + email));

        Long deptId = student.getDepartment() != null ? student.getDepartment().getId() : null;

        List<Event> events;
        if (deptId != null) {
            events = eventRepository.findByDepartmentIdOrDepartmentIsNullOrderByScheduledAtAsc(deptId);
        } else {
            events = eventRepository.findAll()
                    .stream()
                    .filter(e -> e.getDepartment() == null)
                    .sorted((a, b) -> {
                        if (a.getScheduledAt() == null) return 1;
                        if (b.getScheduledAt() == null) return -1;
                        return a.getScheduledAt().compareTo(b.getScheduledAt());
                    })
                    .collect(Collectors.toList());
        }

        return events.stream()
                .map(this::mapEvent)
                .collect(Collectors.toList());
    }

    // ── Mappers ──────────────────────────────────────────────────────────────

    private StudentAnnouncementDTO mapAnnouncement(Announcement a) {
        String postedByRole = "SYSTEM";
        String postedByName = "System";

        if (a.getCreatedBy() != null) {
            Role role = a.getCreatedBy().getRole();
            if (role == Role.PLACEMENT_HEAD) {
                postedByRole = "PLACEMENT_HEAD";
                postedByName = "Placement Head";
            } else if (role == Role.FACULTY) {
                postedByRole = "FACULTY";
                String deptName = a.getDepartment() != null ? a.getDepartment().getName() : "";
                postedByName = "Faculty" + (deptName.isBlank() ? "" : " – " + deptName);
            }
        }

        return StudentAnnouncementDTO.builder()
                .id(a.getId())
                .title(a.getTitle())
                .content(a.getContent())
                .scope(a.getScope() != null ? a.getScope().name() : "GLOBAL")
                .departmentName(a.getDepartment() != null ? a.getDepartment().getName() : null)
                .createdByEmail(a.getCreatedBy() != null ? a.getCreatedBy().getEmail() : "System")
                .postedByRole(postedByRole)
                .postedByName(postedByName)
                .createdAt(a.getCreatedAt())
                .build();
    }

    private StudentEventDTO mapEvent(Event e) {
        return StudentEventDTO.builder()
                .id(e.getId())
                .title(e.getTitle())
                .description(e.getDescription())
                .scheduledAt(e.getScheduledAt())
                .locationOrLink(e.getLocationOrLink())
                .departmentName(e.getDepartment() != null ? e.getDepartment().getName() : null)
                .scope(e.getDepartment() == null ? "GLOBAL" : "DEPARTMENT")
                .build();
    }
}

