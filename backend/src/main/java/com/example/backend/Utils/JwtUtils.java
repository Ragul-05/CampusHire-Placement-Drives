package com.example.backend.Utils;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

@Component
public class JwtUtils {

    @Value("${jwt.secret}")
    private String secret;

    @Value("${jwt.expiration-ms:86400000}")
    private long jwtExpirationMs;

    @Value("${jwt.refresh-expiration-ms:604800000}")
    private long refreshExpirationMs;

    private SecretKey signingKey() {
        return Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
    }

    private String generateToken(String email, String role, String tokenType, long expiresInMs) {
        Date now = new Date();
        return Jwts.builder()
                .subject(email)
                .claim("role", role)
                .claim("tokenType", tokenType)
                .issuedAt(now)
                .expiration(new Date(now.getTime() + expiresInMs))
                .signWith(signingKey())
                .compact();
    }

    public String generateToken(String email, String role) {
        return generateAccessToken(email, role);
    }

    public String generateAccessToken(String email, String role) {
        return generateToken(email, role, "ACCESS", jwtExpirationMs);
    }

    public String generateRefreshToken(String email, String role) {
        return generateToken(email, role, "REFRESH", refreshExpirationMs);
    }

    public String getEmailFromToken(String token) {
        return Jwts.parser()
                .verifyWith(signingKey())
                .build()
                .parseSignedClaims(token)
                .getPayload()
                .getSubject();
    }

    public String getRoleFromToken(String token) {
        return (String) Jwts.parser()
                .verifyWith(signingKey())
                .build()
                .parseSignedClaims(token)
                .getPayload()
                .get("role");
    }

    public String getTokenTypeFromToken(String token) {
        return (String) Jwts.parser()
                .verifyWith(signingKey())
                .build()
                .parseSignedClaims(token)
                .getPayload()
                .get("tokenType");
    }

    public boolean validateToken(String token) {
        try {
            Jwts.parser().verifyWith(signingKey()).build().parseSignedClaims(token);
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    public boolean validateAccessToken(String token) {
        return validateToken(token) && "ACCESS".equalsIgnoreCase(getTokenTypeFromToken(token));
    }

    public boolean validateRefreshToken(String token) {
        return validateToken(token) && "REFRESH".equalsIgnoreCase(getTokenTypeFromToken(token));
    }
}
