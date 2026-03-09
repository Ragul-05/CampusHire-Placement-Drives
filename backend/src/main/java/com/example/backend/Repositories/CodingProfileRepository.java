package com.example.backend.Repositories;

import com.example.backend.Models.CodingProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CodingProfileRepository extends JpaRepository<CodingProfile, Long> {
}
