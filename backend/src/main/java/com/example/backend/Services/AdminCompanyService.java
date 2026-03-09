package com.example.backend.Services;

import com.example.backend.DTOs.Admin.CompanyRequestDTO;
import com.example.backend.DTOs.Admin.CompanyResponseDTO;
import com.example.backend.Exceptions.ResourceNotFoundException;
import com.example.backend.Models.Company;
import com.example.backend.Models.enums.ApplicationStage;
import com.example.backend.Repositories.CompanyRepository;
import com.example.backend.Repositories.DriveApplicationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class AdminCompanyService {


    private CompanyRepository companyRepository;
    private DriveApplicationRepository driveApplicationRepository;

    public AdminCompanyService(CompanyRepository companyRepository, DriveApplicationRepository driveApplicationRepository) {
        this.companyRepository = companyRepository;
        this.driveApplicationRepository = driveApplicationRepository;
    }

    public CompanyResponseDTO addCompany(CompanyRequestDTO dto) {
        Company company = Company.builder()
                .name(dto.getName())
                .website(dto.getWebsite())
                .industry(dto.getIndustry())
                .visitHistory(dto.getVisitHistory())
                .build();

        company = companyRepository.save(company);
        return mapToResponse(company);
    }

    public CompanyResponseDTO updateCompany(Long companyId, CompanyRequestDTO dto) {
        Company company = companyRepository.findById(companyId)
                .orElseThrow(() -> new ResourceNotFoundException("Company not found with id: " + companyId));

        company.setName(dto.getName());
        company.setWebsite(dto.getWebsite());
        company.setIndustry(dto.getIndustry());
        company.setVisitHistory(dto.getVisitHistory());

        company = companyRepository.save(company);
        return mapToResponse(company);
    }

    public CompanyResponseDTO getCompanyById(Long companyId) {
        Company company = companyRepository.findById(companyId)
                .orElseThrow(() -> new ResourceNotFoundException("Company not found with id: " + companyId));
        return mapToResponse(company);
    }

    public List<CompanyResponseDTO> getAllCompanies() {
        return companyRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public void deleteCompany(Long companyId) {
        Company company = companyRepository.findById(companyId)
                .orElseThrow(() -> new ResourceNotFoundException("Company not found with id: " + companyId));
        companyRepository.delete(company);
    }

    private CompanyResponseDTO mapToResponse(Company company) {
        long hiringCount = driveApplicationRepository.countByDriveCompanyIdAndStage(company.getId(),
                ApplicationStage.SELECTED);
        return CompanyResponseDTO.builder()
                .id(company.getId())
                .name(company.getName())
                .website(company.getWebsite())
                .industry(company.getIndustry())
                .visitHistory(company.getVisitHistory())
                .hiringCount(hiringCount)
                .createdAt(company.getCreatedAt())
                .build();
    }
}
