package com.example.backend.Repositories;

import com.example.backend.Models.PlacementDrive;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PlacementDriveRepository extends JpaRepository<PlacementDrive, Long> {
    java.util.List<PlacementDrive> findByStatusIn(
            java.util.List<com.example.backend.Models.enums.DriveStatus> statuses);

    long countByStatus(com.example.backend.Models.enums.DriveStatus status);

    java.util.Optional<PlacementDrive> findTopByOrderByCtcLpaDesc();

    @org.springframework.data.jpa.repository.Query("SELECT p FROM PlacementDrive p JOIN p.eligibilityCriteria e JOIN e.allowedDepartments d WHERE d.id = :departmentId")
    java.util.List<PlacementDrive> findByAllowedDepartmentId(
            @org.springframework.data.repository.query.Param("departmentId") Long departmentId);

    @org.springframework.data.jpa.repository.Query("SELECT p FROM PlacementDrive p JOIN p.eligibilityCriteria e JOIN e.allowedDepartments d WHERE d.id = :departmentId AND p.status IN :statuses")
    java.util.List<PlacementDrive> findByAllowedDepartmentIdAndStatusIn(
            @org.springframework.data.repository.query.Param("departmentId") Long departmentId,
            @org.springframework.data.repository.query.Param("statuses") java.util.List<com.example.backend.Models.enums.DriveStatus> statuses);

    @org.springframework.data.jpa.repository.Query("SELECT COUNT(p) FROM PlacementDrive p JOIN p.eligibilityCriteria e JOIN e.allowedDepartments d WHERE d.id = :departmentId AND p.status = :status")
    long countByAllowedDepartmentIdAndStatus(
            @org.springframework.data.repository.query.Param("departmentId") Long departmentId,
            @org.springframework.data.repository.query.Param("status") com.example.backend.Models.enums.DriveStatus status);

    @org.springframework.data.jpa.repository.Query("SELECT p FROM PlacementDrive p JOIN p.eligibilityCriteria e JOIN e.allowedDepartments d WHERE p.status IN :statuses AND d.id = :departmentId")
    java.util.List<PlacementDrive> findByStatusInAndAllowedDepartmentId(
            @org.springframework.data.repository.query.Param("statuses") java.util.List<com.example.backend.Models.enums.DriveStatus> statuses,
            @org.springframework.data.repository.query.Param("departmentId") Long departmentId);
}
