package com.example.backend.Repositories;

import com.example.backend.Models.Announcement;
import com.example.backend.Models.enums.AnnouncementScope;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AnnouncementRepository extends JpaRepository<Announcement, Long> {

    List<Announcement> findByDepartmentIdOrderByCreatedAtDesc(Long departmentId);

    /**
     * Fetch all announcements visible to a student:
     *  - scope = GLOBAL  (from Placement Head)
     *  - scope = DEPARTMENT AND department_id = :deptId  (from Faculty of their dept)
     * Eagerly loads createdBy user and department to avoid lazy-load issues.
     */
    @Query("""
        SELECT DISTINCT a FROM Announcement a
        LEFT JOIN FETCH a.createdBy u
        LEFT JOIN FETCH a.department d
        WHERE a.scope = :globalScope
           OR (a.scope <> :globalScope AND a.department.id = :departmentId)
        ORDER BY a.createdAt DESC
        """)
    List<Announcement> findVisibleToStudent(
            @Param("departmentId") Long departmentId,
            @Param("globalScope") AnnouncementScope globalScope);

    /**
     * Fetch all GLOBAL announcements only (for students with no department).
     */
    @Query("""
        SELECT a FROM Announcement a
        LEFT JOIN FETCH a.createdBy u
        LEFT JOIN FETCH a.department d
        WHERE a.scope = com.example.backend.Models.enums.AnnouncementScope.GLOBAL
        ORDER BY a.createdAt DESC
        """)
    List<Announcement> findAllGlobalAnnouncements();

    // Keep for backward compat (used by admin/faculty services)
    List<Announcement> findByDepartmentIdOrScopeOrderByCreatedAtDesc(Long departmentId,
            AnnouncementScope scope);
}


