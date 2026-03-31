package com.example.backend.Repositories;

import com.example.backend.Models.ProfileVerification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ProfileVerificationRepository extends JpaRepository<ProfileVerification, Long> {
    java.util.List<ProfileVerification> findByFacultyId(Long facultyId);

    java.util.List<ProfileVerification> findByStudentProfileUserDepartmentId(Long departmentId);

    java.util.Optional<ProfileVerification> findByStudentProfileId(Long studentProfileId);

    java.util.Optional<ProfileVerification> findTopByStudentProfileIdOrderByVerifiedAtDesc(Long studentProfileId);
}
