package com.example.backend.Services;

import com.example.backend.Models.enums.Role;
import org.springframework.stereotype.Service;

@Service
public class PromptService {

    public String buildGeneralPrompt(Role role, String userMessage) {
        return "You are CampusHire AI Assistant for the " + role.name() + " portal. "
                + "Answer only in simple English. "
                + "Do not invent application data. "
                + "Do not mention databases or internal APIs. "
                + "If the question requires live application data, explain that the portal will fetch it from backend data services. "
                + "If the question is about career guidance, resume tips, interview preparation, or placement advice, answer directly. "
                + "User question: " + userMessage;
    }
}