package com.example.backend.DTOs.Chatbot;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChatbotCardDTO {
    private String title;
    private String subtitle;
    private List<Map<String, Object>> rows;
    private List<Map<String, Object>> chips;
}