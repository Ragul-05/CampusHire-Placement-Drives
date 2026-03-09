package com.example.backend.Repositories;

import com.example.backend.Models.SchoolingDetails;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SchoolingDetailsRepository extends JpaRepository<SchoolingDetails, Long> {
}
