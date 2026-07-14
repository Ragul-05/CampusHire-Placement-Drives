package com.example.backend.Controllers;

import com.example.backend.DTOs.Chatbot.ChatbotQueryRequest;
import com.example.backend.DTOs.Chatbot.ChatbotResponseDTO;
import com.example.backend.Services.ChatbotService;
import com.example.backend.Utils.ApiResponse;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
@RequestMapping("/api/chatbot")
public class ChatbotController {

    private final ChatbotService chatbotService;

    public ChatbotController(ChatbotService chatbotService) {
        this.chatbotService = chatbotService;
    }

    @PostMapping("/query")
    public ResponseEntity<ApiResponse<ChatbotResponseDTO>> query(
            @Valid @RequestBody ChatbotQueryRequest request,
            Authentication authentication) {

        if (authentication == null || authentication.getName() == null || authentication.getName().isBlank()) {
            return ResponseEntity.status(401).body(ApiResponse.error("Unauthorized"));
        }

        ChatbotResponseDTO response = chatbotService.handleQuery(authentication.getName(), request.getMessage());
        return ResponseEntity.ok(ApiResponse.success("Chatbot response generated successfully", response));
    }
}