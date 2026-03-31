package com.example.backend.Repositories;

import com.example.backend.Models.StudentProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;


import java.util.Optional;

@Repository
public interface StudentProfileRepository extends JpaRepository<StudentProfile, Long> {
    Optional<StudentProfile> findByRollNo(String rollNo);

    Optional<StudentProfile> findByUserEmail(String email);

    // Full profile fetch with all ONE-TO-ONE associations — used for profile page GET
    @org.springframework.data.jpa.repository.Query("""
        SELECT DISTINCT s FROM StudentProfile s
        LEFT JOIN FETCH s.user u
        LEFT JOIN FETCH u.department
        LEFT JOIN FETCH s.personalDetails
        LEFT JOIN FETCH s.contactDetails
        LEFT JOIN FETCH s.academicRecord
        LEFT JOIN FETCH s.schoolingDetails
        LEFT JOIN FETCH s.professionalProfile
        LEFT JOIN FETCH s.identityDocs
        WHERE u.email = :email
        """)
    Optional<StudentProfile> findFullProfileByUserEmail(
        @org.springframework.data.repository.query.Param("email") String email);

    // Separate certifications + skills fetch (kept separate to avoid MultipleBagFetchException)
    @org.springframework.data.jpa.repository.Query("""
        SELECT DISTINCT s FROM StudentProfile s
        LEFT JOIN FETCH s.certifications
        WHERE s.user.email = :email
        """)
    Optional<StudentProfile> findProfileWithCertificationsByUserEmail(
        @org.springframework.data.repository.query.Param("email") String email);

    @org.springframework.data.jpa.repository.Query("""
        SELECT DISTINCT s FROM StudentProfile s
        LEFT JOIN FETCH s.skills
        WHERE s.user.email = :email
        """)
    Optional<StudentProfile> findProfileWithSkillsByUserEmail(
        @org.springframework.data.repository.query.Param("email") String email);

    long countByIsPlacedTrue();

    long countByVerificationStatus(com.example.backend.Models.enums.VerificationStatus status);

    @org.springframework.data.jpa.repository.Query("SELECT COALESCE(MAX(s.highestPackageLpa), 0) FROM StudentProfile s")
    Double findHighestCtc();

    @org.springframework.data.jpa.repository.Query("SELECT COALESCE(AVG(s.highestPackageLpa), 0) FROM StudentProfile s WHERE s.isPlaced = true")
    Double findAverageCtc();

    @org.springframework.data.jpa.repository.Query("SELECT s FROM StudentProfile s WHERE s.verificationStatus = 'VERIFIED' AND (:query IS NULL OR LOWER(s.user.email) LIKE LOWER(CONCAT('%', :query, '%')) OR LOWER(s.rollNo) LIKE LOWER(CONCAT('%', :query, '%')) )")
    java.util.List<StudentProfile> searchVerifiedStudents(
            @org.springframework.data.repository.query.Param("query") String query);

    @org.springframework.data.jpa.repository.Query("SELECT d.name, COUNT(s) FROM StudentProfile s JOIN s.user u JOIN u.department d WHERE s.isPlaced = true GROUP BY d.name")
    java.util.List<Object[]> countPlacementsByDepartment();

    // Faculty Scoped Queries
    java.util.List<StudentProfile> findByUserDepartmentId(Long departmentId);

    long countByUserDepartmentId(Long departmentId);

    long countByUserDepartmentIdAndVerificationStatus(Long departmentId,
            com.example.backend.Models.enums.VerificationStatus status);

    long countByUserDepartmentIdAndIsPlacedTrue(Long departmentId);

    java.util.List<StudentProfile> findByUserDepartmentIdAndVerificationStatus(
            Long departmentId, com.example.backend.Models.enums.VerificationStatus status);

    java.util.List<StudentProfile> findByVerificationStatus(
            com.example.backend.Models.enums.VerificationStatus status);

    long countByUserDepartmentIdAndIsEligibleForPlacementsTrue(Long departmentId);

    java.util.List<StudentProfile> findByVerificationStatusAndEligibleForAdminReviewTrue(
            com.example.backend.Models.enums.VerificationStatus status);

    java.util.List<StudentProfile> findByEligibleForAdminReviewTrue();
}
