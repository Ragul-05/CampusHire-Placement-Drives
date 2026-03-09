package com.example.backend.Exceptions;

public class InvalidDriveStateException extends RuntimeException {
    public InvalidDriveStateException(String message) {
        super(message);
    }
}
