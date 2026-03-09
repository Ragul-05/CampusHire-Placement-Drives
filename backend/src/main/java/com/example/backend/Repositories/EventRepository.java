package com.example.backend.Repositories;

import com.example.backend.Models.Event;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface EventRepository extends JpaRepository<Event, Long> {
    java.util.List<Event> findByDepartmentIdOrderByScheduledAtAsc(Long departmentId);

    java.util.List<Event> findByDepartmentIdOrDepartmentIsNullOrderByScheduledAtAsc(Long departmentId);
}
