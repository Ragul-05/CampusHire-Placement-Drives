package com.example.backend.Repositories;

import com.example.backend.Models.Offer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface OfferRepository extends JpaRepository<Offer, Long> {
    List<Offer> findByDriveId(Long driveId);

    Optional<Offer> findByIdAndStudentProfileId(Long id, Long studentId);

    Optional<Offer> findByDriveIdAndStudentProfileId(Long driveId, Long studentId);

    List<Offer> findAllByOrderByIssuedAtDesc();

    @Query("SELECT o FROM Offer o LEFT JOIN FETCH o.drive d LEFT JOIN FETCH d.company WHERE o.studentProfile.id = :studentId")
    List<Offer> findByStudentProfileId(@Param("studentId") Long studentId);

    @org.springframework.data.jpa.repository.Query("SELECT c.name, COUNT(o) FROM Offer o JOIN o.drive d JOIN d.company c GROUP BY c.name ORDER BY COUNT(o) DESC")
    List<Object[]> countOffersByCompany();

    @org.springframework.data.jpa.repository.Query("SELECT d.name, COUNT(o) FROM Offer o JOIN o.studentProfile s JOIN s.user u JOIN u.department d GROUP BY d.name")
    List<Object[]> countOffersByDepartment();

    @org.springframework.data.jpa.repository.Query("SELECT c.name, COUNT(o) FROM Offer o JOIN o.drive d JOIN d.company c WHERE o.studentProfile.user.department.id = :departmentId GROUP BY c.name ORDER BY COUNT(o) DESC")
    List<Object[]> countOffersByCompanyForDepartment(@Param("departmentId") Long departmentId);

    long countByStudentProfileUserDepartmentId(Long departmentId);

    List<Offer> findByStudentProfileUserDepartmentIdOrderByIssuedAtDesc(Long departmentId);
}


