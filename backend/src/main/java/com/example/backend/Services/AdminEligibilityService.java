package com.example.backend.Services;

import com.example.backend.DTOs.Admin.EligibilityCriteriaDTO;
import com.example.backend.Exceptions.InvalidDriveStateException;
import com.example.backend.Exceptions.ResourceNotFoundException;
import com.example.backend.Models.Department;
import com.example.backend.Models.EligibilityCriteria;
import com.example.backend.Models.PlacementDrive;
import com.example.backend.Models.enums.DriveStatus;
import com.example.backend.Repositories.DepartmentRepository;
import com.example.backend.Repositories.EligibilityCriteriaRepository;
import com.example.backend.Repositories.PlacementDriveRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class AdminEligibilityService {

    @Autowired
    private EligibilityCriteriaRepository eligibilityCriteriaRepository;

    @Autowired
    private PlacementDriveRepository driveRepository;

    @Autowired
    private DepartmentRepository departmentRepository;

    public EligibilityCriteriaDTO setEligibilityCriteria(Long driveId, EligibilityCriteriaDTO dto) {
        PlacementDrive drive = driveRepository.findById(driveId)
                .orElseThrow(() -> new ResourceNotFoundException("Drive not found with id: " + driveId));

        if (drive.getStatus() != DriveStatus.UPCOMING) {
            throw new InvalidDriveStateException("Eligibility criteria can only be set when the drive is UPCOMING");
        }

        List<Department> allowedDepartments = null;
        if (dto.getAllowedDepartmentIds() != null && !dto.getAllowedDepartmentIds().isEmpty()) {
            allowedDepartments = departmentRepository.findAllById(dto.getAllowedDepartmentIds());
        }

        EligibilityCriteria criteria = eligibilityCriteriaRepository.findById(driveId)
                .orElse(new EligibilityCriteria());
        criteria.setDrive(drive);
        criteria.setMinCgpa(dto.getMinCgpa());
        criteria.setMinXMarks(dto.getMinXMarks());
        criteria.setMinXiiMarks(dto.getMinXiiMarks());
        criteria.setMaxStandingArrears(dto.getMaxStandingArrears());
        criteria.setMaxHistoryOfArrears(dto.getMaxHistoryOfArrears());
        criteria.setGraduationYear(dto.getGraduationYear());
        criteria.setRequiredSkills(dto.getRequiredSkills());
        criteria.setAllowedDepartments(allowedDepartments);

        criteria = eligibilityCriteriaRepository.save(criteria);
        return mapToDTO(criteria);
    }

    public EligibilityCriteriaDTO getEligibilityCriteria(Long driveId) {
        EligibilityCriteria criteria = eligibilityCriteriaRepository.findById(driveId)
                .orElseThrow(
                        () -> new ResourceNotFoundException("Eligibility criteria not found for drive: " + driveId));
        return mapToDTO(criteria);
    }

    private EligibilityCriteriaDTO mapToDTO(EligibilityCriteria criteria) {
        EligibilityCriteriaDTO dto = new EligibilityCriteriaDTO();
        dto.setMinCgpa(criteria.getMinCgpa());
        dto.setMinXMarks(criteria.getMinXMarks());
        dto.setMinXiiMarks(criteria.getMinXiiMarks());
        dto.setMaxStandingArrears(criteria.getMaxStandingArrears());
        dto.setMaxHistoryOfArrears(criteria.getMaxHistoryOfArrears());
        dto.setGraduationYear(criteria.getGraduationYear());
        dto.setRequiredSkills(criteria.getRequiredSkills());
        if (criteria.getAllowedDepartments() != null) {
            dto.setAllowedDepartmentIds(criteria.getAllowedDepartments().stream()
                    .map(Department::getId)
                    .collect(Collectors.toList()));
        }
        return dto;
    }
}
