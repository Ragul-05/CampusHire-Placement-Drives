package com.example.backend.Repositories;

import com.example.backend.Models.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);

    Optional<User> findByUniversityRegNo(String universityRegNo);

    long countByRole(com.example.backend.Models.enums.Role role);
}
