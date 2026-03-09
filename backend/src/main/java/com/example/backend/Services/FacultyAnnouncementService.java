package com.example.backend.Services;

import com.example.backend.Exceptions.ResourceNotFoundException;
import com.example.backend.Exceptions.UnauthorizedActionException;
import com.example.backend.Models.Announcement;
import com.example.backend.Models.Event;
import com.example.backend.Models.User;
import com.example.backend.Models.enums.AnnouncementScope;
import com.example.backend.Repositories.AnnouncementRepository;
import com.example.backend.Repositories.EventRepository;
import com.example.backend.Repositories.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class FacultyAnnouncementService {

    @Autowired
    private AnnouncementRepository announcementRepository;

    @Autowired
    private EventRepository eventRepository;

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

    public List<Announcement> getDepartmentAnnouncements(String facultyEmail) {
        User faculty = getAuthenticatedFaculty(facultyEmail);
        return announcementRepository.findByDepartmentIdOrScopeOrderByCreatedAtDesc(
                faculty.getDepartment().getId(),
                AnnouncementScope.GLOBAL);
    }

    public Announcement createDepartmentAnnouncement(Announcement request, String facultyEmail) {
        User faculty = getAuthenticatedFaculty(facultyEmail);

        Announcement announcement = Announcement.builder()
                .title(request.getTitle())
                .content(request.getContent())
                .scope(AnnouncementScope.DEPARTMENT)
                .department(faculty.getDepartment())
                .createdBy(faculty)
                .createdAt(LocalDateTime.now())
                .build();

        return announcementRepository.save(announcement);
    }

    public void deleteAnnouncement(Long announcementId, String facultyEmail) {
        User faculty = getAuthenticatedFaculty(facultyEmail);
        Announcement announcement = announcementRepository.findById(announcementId)
                .orElseThrow(() -> new ResourceNotFoundException("Announcement not found"));

        if (announcement.getDepartment() == null
                || !announcement.getDepartment().getId().equals(faculty.getDepartment().getId())) {
            throw new UnauthorizedActionException("Cannot delete global or other department announcements");
        }

        announcementRepository.delete(announcement);
    }

    public List<Event> getDepartmentEvents(String facultyEmail) {
        User faculty = getAuthenticatedFaculty(facultyEmail);
        return eventRepository
                .findByDepartmentIdOrDepartmentIsNullOrderByScheduledAtAsc(faculty.getDepartment().getId());
    }

    public Event createDepartmentEvent(Event request, String facultyEmail) {
        User faculty = getAuthenticatedFaculty(facultyEmail);

        Event event = Event.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .scheduledAt(request.getScheduledAt())
                .locationOrLink(request.getLocationOrLink())
                .department(faculty.getDepartment())
                .build();

        return eventRepository.save(event);
    }

    public void deleteEvent(Long eventId, String facultyEmail) {
        User faculty = getAuthenticatedFaculty(facultyEmail);
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new ResourceNotFoundException("Event not found"));

        if (event.getDepartment() == null || !event.getDepartment().getId().equals(faculty.getDepartment().getId())) {
            throw new UnauthorizedActionException("Cannot delete global or other department events");
        }

        eventRepository.delete(event);
    }
}
