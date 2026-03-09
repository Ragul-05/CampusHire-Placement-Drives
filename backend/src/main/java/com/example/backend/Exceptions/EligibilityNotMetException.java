package com.example.backend.Exceptions;

public class EligibilityNotMetException extends RuntimeException {
    public EligibilityNotMetException(String message) {
        super(message);
    }
}
