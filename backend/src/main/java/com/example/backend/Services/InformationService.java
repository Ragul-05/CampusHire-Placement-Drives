package com.example.backend.Services;

import com.example.backend.Models.Announcement;
import com.example.backend.Models.Company;
import com.example.backend.Models.Event;
import com.example.backend.Repositories.AnnouncementRepository;
import com.example.backend.Repositories.CompanyRepository;
import com.example.backend.Repositories.EventRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class InformationService {

    @Autowired
    private CompanyRepository companyRepository;

    @Autowired
    private AnnouncementRepository announcementRepository;

    @Autowired
    private EventRepository eventRepository;

    public List<Company> getAllCompanies() {
        return companyRepository.findAll();
    }

    public List<Announcement> getAnnouncements() {
        return announcementRepository.findAll();
    }

    public List<Event> getEvents() {
        return eventRepository.findAll();
    }
}
