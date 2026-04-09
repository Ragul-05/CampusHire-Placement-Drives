package com.example.backend.Services;

import com.example.backend.DTOs.Admin.DashboardStatsDTO;
import com.example.backend.Models.enums.DriveStatus;
import com.example.backend.Models.enums.Role;
import com.example.backend.Models.enums.VerificationStatus;
import com.example.backend.Repositories.CompanyRepository;
import com.example.backend.Repositories.OfferRepository;
import com.example.backend.Repositories.PlacementDriveRepository;
import com.example.backend.Repositories.StudentProfileRepository;
import com.example.backend.Repositories.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class AdminDashboardService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private StudentProfileRepository studentProfileRepository;

    @Autowired
    private PlacementDriveRepository placementDriveRepository;

    @Autowired
    private CompanyRepository companyRepository;

    @Autowired
    private OfferRepository offerRepository;

    public DashboardStatsDTO getDashboardStats() {
        return DashboardStatsDTO.builder()
                .totalStudents(userRepository.countByRole(Role.STUDENT))
                .verifiedStudents(studentProfileRepository.countByVerificationStatus(VerificationStatus.VERIFIED))
                .placedStudents(studentProfileRepository.countByIsPlacedTrue())
                .totalOffers(offerRepository.count())
                .ongoingDrives(placementDriveRepository.countByStatus(DriveStatus.ONGOING))
                .completedDrives(placementDriveRepository.countByStatus(DriveStatus.COMPLETED))
                .highestCtc(studentProfileRepository.findHighestCtc())
                .averageCtc(studentProfileRepository.findAverageCtc())
                .totalCompanies(companyRepository.count())
                .build();
    }
}
