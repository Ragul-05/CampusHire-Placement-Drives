package com.example.backend.Repositories;

import com.example.backend.Models.ChatbotLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ChatbotLogRepository extends JpaRepository<ChatbotLog, Long> {
}