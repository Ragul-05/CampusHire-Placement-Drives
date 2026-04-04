package com.example.backend.Repositories;

import com.example.backend.Models.DriveApplication;
import com.example.backend.Models.enums.ApplicationStage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface DriveApplicationRepository extends JpaRepository<DriveApplication, Long> {
    boolean existsByStudentProfileIdAndDriveId(Long studentId, Long driveId);

    java.util.List<DriveApplication> findByStudentProfileId(Long studentId);

    long countByDriveCompanyIdAndStage(Long companyId, com.example.backend.Models.enums.ApplicationStage stage);

    java.util.List<DriveApplication> findByDriveIdAndStage(Long driveId,
            com.example.backend.Models.enums.ApplicationStage stage);

    java.util.List<DriveApplication> findByDriveId(Long driveId);

    long countByDriveId(Long driveId);

    long countByDriveIdAndStage(Long driveId, ApplicationStage stage);

    // Faculty Scoped Queries
    java.util.List<DriveApplication> findByStudentProfileUserDepartmentId(Long departmentId);

    java.util.List<DriveApplication> findByDriveIdAndStudentProfileUserDepartmentId(Long driveId, Long departmentId);

    long countByStudentProfileUserDepartmentIdAndStage(Long departmentId,
            com.example.backend.Models.enums.ApplicationStage stage);

    long countByDriveIdAndStudentProfileUserDepartmentId(Long driveId, Long departmentId);

    Optional<DriveApplication> findByStudentProfileIdAndDriveId(Long studentId, Long driveId);

    java.util.List<DriveApplication> findByDriveIdAndStudentProfileIdIn(Long driveId, java.util.List<Long> studentIds);

    java.util.List<DriveApplication> findByDriveIdAndFacultyApprovedTrue(Long driveId);

    long countByDriveIdAndFacultyApprovedTrueAndSubmittedToAdminTrue(Long driveId);

    @Query("""
            SELECT da.drive.company.name, da.stage, COUNT(da)
            FROM DriveApplication da
            WHERE (:departmentId IS NULL OR da.studentProfile.user.department.id = :departmentId)
            GROUP BY da.drive.company.name, da.stage
            """)
    java.util.List<Object[]> countByCompanyAndStage(@Param("departmentId") Long departmentId);
}
