package com.example.backend.Services;

import com.example.backend.DTOs.Faculty.FacultyAnalyticsDTO;
import com.example.backend.Exceptions.ResourceNotFoundException;
import com.example.backend.Exceptions.UnauthorizedActionException;
import com.example.backend.Models.DriveApplication;
import com.example.backend.Models.StudentProfile;
import com.example.backend.Models.User;
import com.example.backend.Models.enums.ApplicationStage;
import com.example.backend.Repositories.DriveApplicationRepository;
import com.example.backend.Repositories.StudentProfileRepository;
import com.example.backend.Repositories.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class FacultyAnalyticsService {

    @Autowired
    private StudentProfileRepository studentProfileRepository;

    @Autowired
    private DriveApplicationRepository driveApplicationRepository;

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

    public FacultyAnalyticsDTO getDepartmentAnalytics(String facultyEmail) {
        User faculty = getAuthenticatedFaculty(facultyEmail);
        Long departmentId = faculty.getDepartment().getId();

        List<StudentProfile> students = studentProfileRepository.findByUserDepartmentId(departmentId);

        long totalStudents = students.size();
        List<StudentProfile> placedStudents = students.stream().filter(s -> s.getIsPlaced() != null && s.getIsPlaced())
                .collect(Collectors.toList());
        long totalPlaced = placedStudents.size();

        double averagePackage = placedStudents.stream()
                .filter(s -> s.getHighestPackageLpa() != null)
                .mapToDouble(StudentProfile::getHighestPackageLpa)
                .average()
                .orElse(0.0);

        double highestPackage = placedStudents.stream()
                .filter(s -> s.getHighestPackageLpa() != null)
                .mapToDouble(StudentProfile::getHighestPackageLpa)
                .max()
                .orElse(0.0);

        double placementPercentage = totalStudents > 0 ? ((double) totalPlaced / totalStudents) * 100 : 0.0;
        placementPercentage = Math.round(placementPercentage * 100.0) / 100.0;
        averagePackage = Math.round(averagePackage * 100.0) / 100.0;

        // Top recruiters - analyzing all SELECTED applications for this department
        List<DriveApplication> applications = driveApplicationRepository
                .findByStudentProfileUserDepartmentId(departmentId);
        Map<String, Long> topRecruiters = applications.stream()
                .filter(a -> a.getStage() == ApplicationStage.SELECTED)
                .collect(Collectors.groupingBy(a -> a.getDrive().getCompany().getName(), Collectors.counting()));

        return FacultyAnalyticsDTO.builder()
                .totalEligible(totalStudents)
                .totalPlaced(totalPlaced)
                .placementPercentage(placementPercentage)
                .averagePackageLpa(averagePackage)
                .highestPackageLpa(highestPackage)
                .topRecruiters(topRecruiters)
                .build();
    }
}
