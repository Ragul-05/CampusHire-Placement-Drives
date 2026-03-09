package com.example.backend.Services;

import com.example.backend.DTOs.Admin.PlacementDriveRequestDTO;
import com.example.backend.DTOs.Admin.PlacementDriveResponseDTO;
import com.example.backend.Exceptions.InvalidDriveStateException;
import com.example.backend.Exceptions.ResourceNotFoundException;
import com.example.backend.Models.Company;
import com.example.backend.Models.PlacementDrive;
import com.example.backend.Models.enums.DriveStatus;
import com.example.backend.Repositories.CompanyRepository;
import com.example.backend.Repositories.PlacementDriveRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class AdminPlacementDriveService {


    private PlacementDriveRepository driveRepository;
    private CompanyRepository companyRepository;

    public AdminPlacementDriveService(PlacementDriveRepository driveRepository, CompanyRepository companyRepository) {
        this.driveRepository = driveRepository;
        this.companyRepository = companyRepository;
    }
    public PlacementDriveResponseDTO createDrive(PlacementDriveRequestDTO dto) {
        Company company = companyRepository.findById(dto.getCompanyId())
                .orElseThrow(() -> new ResourceNotFoundException("Company not found with id: " + dto.getCompanyId()));

        PlacementDrive drive = PlacementDrive.builder()
                .company(company)
                .title(dto.getTitle())
                .role(dto.getRole())
                .ctcLpa(dto.getCtcLpa())
                .description(dto.getDescription())
                .status(dto.getStatus() != null ? dto.getStatus() : DriveStatus.UPCOMING)
                .build();

        drive = driveRepository.save(drive);
        return mapToResponse(drive);
    }

    public PlacementDriveResponseDTO updateDrive(Long driveId, PlacementDriveRequestDTO dto) {
        PlacementDrive drive = driveRepository.findById(driveId)
                .orElseThrow(() -> new ResourceNotFoundException("Placement Drive not found"));

        Company company = companyRepository.findById(dto.getCompanyId())
                .orElseThrow(() -> new ResourceNotFoundException("Company not found with id: " + dto.getCompanyId()));

        drive.setCompany(company);
        drive.setTitle(dto.getTitle());
        drive.setRole(dto.getRole());
        drive.setCtcLpa(dto.getCtcLpa());
        drive.setDescription(dto.getDescription());

        if (dto.getStatus() != null) {
            drive.setStatus(dto.getStatus());
        }

        drive = driveRepository.save(drive);
        return mapToResponse(drive);
    }

    public PlacementDriveResponseDTO updateDriveStatus(Long driveId, DriveStatus newStatus) {
        PlacementDrive drive = driveRepository.findById(driveId)
                .orElseThrow(() -> new ResourceNotFoundException("Placement Drive not found"));

        if (drive.getStatus() == DriveStatus.COMPLETED) {
            throw new InvalidDriveStateException("Cannot change status of a completed drive");
        }

        drive.setStatus(newStatus);
        drive = driveRepository.save(drive);
        return mapToResponse(drive);
    }

    public PlacementDriveResponseDTO getDriveById(Long driveId) {
        PlacementDrive drive = driveRepository.findById(driveId)
                .orElseThrow(() -> new ResourceNotFoundException("Placement Drive not found"));
        return mapToResponse(drive);
    }

    public List<PlacementDriveResponseDTO> getAllDrives() {
        return driveRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    private PlacementDriveResponseDTO mapToResponse(PlacementDrive drive) {
        return PlacementDriveResponseDTO.builder()
                .id(drive.getId())
                .companyId(drive.getCompany().getId())
                .companyName(drive.getCompany().getName())
                .title(drive.getTitle())
                .role(drive.getRole())
                .ctcLpa(drive.getCtcLpa())
                .description(drive.getDescription())
                .status(drive.getStatus())
                .createdAt(drive.getCreatedAt())
                .build();
    }
}
