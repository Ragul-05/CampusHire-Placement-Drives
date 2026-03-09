package com.example.backend.Repositories;

import com.example.backend.Models.IdentityDocs;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface IdentityDocsRepository extends JpaRepository<IdentityDocs, Long> {
    Optional<IdentityDocs> findByAadharNumber(String aadharNumber);
}
