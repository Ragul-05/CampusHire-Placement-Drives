package com.example.backend.Exceptions;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(HttpStatus.FORBIDDEN)
public class ProfileLockedException extends RuntimeException {
    public ProfileLockedException(String message) {
        super(message);
    }
}
