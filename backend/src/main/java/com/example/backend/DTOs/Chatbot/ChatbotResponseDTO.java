package com.example.backend.DTOs.Chatbot;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChatbotResponseDTO {
    private String role;
    private String intent;
    private String reply;
    private Boolean usedGemini;
    private Boolean noData;
    private List<ChatbotCardDTO> cards;
    private List<String> suggestions;
}