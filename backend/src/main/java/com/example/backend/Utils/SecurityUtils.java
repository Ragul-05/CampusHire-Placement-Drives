package com.example.backend.Utils;

import org.mindrot.jbcrypt.BCrypt;

public class SecurityUtils {

    public static String hashPassword(String plainPassword) {
        return BCrypt.hashpw(plainPassword, BCrypt.gensalt(10));
    }

    public static boolean checkPassword(String plainPassword, String hashedPassword) {
        try {
            return BCrypt.checkpw(plainPassword, hashedPassword);
        } catch (IllegalArgumentException ex) {
            return false; // invalid hash format
        }
    }
}
