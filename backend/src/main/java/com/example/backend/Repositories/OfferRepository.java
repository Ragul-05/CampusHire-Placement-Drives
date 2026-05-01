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

    @Query(value = """
            SELECT
                sp.id AS student_id,
                COALESCE(NULLIF(TRIM(CONCAT_WS(' ', p.first_name, p.last_name)), ''), u.email) AS student_name,
                d.name AS department_name,
                d.id AS department_id,
                COUNT(o.id) AS offer_count,
                STRING_AGG(c.name, ', ' ORDER BY o.issued_at DESC) AS company_names,
                STRING_AGG(COALESCE(o.ctc::text, 'N/A'), ', ' ORDER BY o.issued_at DESC) AS packages
            FROM offers o
            JOIN student_profiles sp ON sp.id = o.student_id
            JOIN users u ON u.id = sp.user_id
            LEFT JOIN departments d ON d.id = u.department_id
            LEFT JOIN placement_drives pd ON pd.id = o.drive_id
            LEFT JOIN companies c ON c.id = pd.company_id
            LEFT JOIN student_personal_details p ON p.student_id = sp.id
            WHERE (:departmentId IS NULL OR u.department_id = :departmentId)
            GROUP BY sp.id, p.first_name, p.last_name, u.email, d.name, d.id
            HAVING (:offerFilter = 'ALL' OR (:offerFilter = 'SINGLE' AND COUNT(o.id) = 1) OR (:offerFilter = 'MULTIPLE' AND COUNT(o.id) >= 2))
            ORDER BY COALESCE(NULLIF(TRIM(CONCAT_WS(' ', p.first_name, p.last_name)), ''), u.email)
            """, nativeQuery = true)
    List<Object[]> findOfferFilterRows(
            @Param("departmentId") Long departmentId,
            @Param("offerFilter") String offerFilter);
}


