package com.example.backend.Services;

import com.example.backend.Models.DriveApplication;
import com.example.backend.Models.StudentProfile;
import com.example.backend.Repositories.DriveApplicationRepository;
import com.example.backend.Repositories.StudentProfileRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class AdminExportService {

    @Autowired
    private StudentProfileRepository studentRepository;

    @Autowired
    private DriveApplicationRepository applicationRepository;

    public String exportVerifiedStudentsCsv() {
        // Find verified students by querying all and filtering, or write a new query.
        List<StudentProfile> students = studentRepository.searchVerifiedStudents("");

        StringBuilder csvBuilder = new StringBuilder();
        csvBuilder.append("Student ID,Email,Roll No,Department,Batch,CGPA,Is Placed,Highest Package (LPA)\n");

        for (StudentProfile s : students) {
            String email = s.getUser() != null ? s.getUser().getEmail() : "N/A";
            String dept = (s.getUser() != null && s.getUser().getDepartment() != null)
                    ? s.getUser().getDepartment().getName()
                    : "N/A";
            double cgpa = s.getAcademicRecord() != null ? s.getAcademicRecord().getCgpa() : 0.0;
            boolean placed = s.getIsPlaced() != null ? s.getIsPlaced() : false;
            double lpa = s.getHighestPackageLpa() != null ? s.getHighestPackageLpa() : 0.0;

            csvBuilder.append(s.getId()).append(",")
                    .append(email).append(",")
                    .append(s.getRollNo()).append(",")
                    .append(dept).append(",")
                    .append(s.getBatch()).append(",")
                    .append(cgpa).append(",")
                    .append(placed ? "Yes" : "No").append(",")
                    .append(lpa).append("\n");
        }

        return csvBuilder.toString();
    }

    public String exportDriveResultsCsv(Long driveId) {
        List<DriveApplication> applications = applicationRepository.findByDriveId(driveId);

        StringBuilder csvBuilder = new StringBuilder();
        csvBuilder.append("Application ID,Student Email,Roll No,Department,Stage,Applied At\n");

        for (DriveApplication app : applications) {
            String email = app.getStudentProfile().getUser() != null ? app.getStudentProfile().getUser().getEmail()
                    : "N/A";
            String rollNo = app.getStudentProfile().getRollNo();
            String dept = (app.getStudentProfile().getUser() != null
                    && app.getStudentProfile().getUser().getDepartment() != null)
                            ? app.getStudentProfile().getUser().getDepartment().getName()
                            : "N/A";

            csvBuilder.append(app.getId()).append(",")
                    .append(email).append(",")
                    .append(rollNo).append(",")
                    .append(dept).append(",")
                    .append(app.getStage().name()).append(",")
                    .append(app.getAppliedAt() != null ? app.getAppliedAt().toString() : "N/A").append("\n");
        }

        return csvBuilder.toString();
    }
}
