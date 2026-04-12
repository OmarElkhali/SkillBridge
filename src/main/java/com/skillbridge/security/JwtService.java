package com.skillbridge.security;

import com.skillbridge.config.AppProperties;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;
import javax.crypto.SecretKey;

@Service
public class JwtService {

    private final AppProperties properties;

    public JwtService(AppProperties properties) {
        this.properties = properties;
    }

    public String generateToken(AppUserPrincipal principal) {
        Instant now = Instant.now();
        Instant expiry = now.plusMillis(properties.jwt().expirationMs());
        return Jwts.builder()
                .subject(principal.getUsername())
                .claim("userId", principal.getId())
                .claim("role", principal.getRole())
                .issuedAt(Date.from(now))
                .expiration(Date.from(expiry))
                .signWith(getSigningKey())
                .compact();
    }

    public String extractUsername(String token) {
        return extractClaims(token).getSubject();
    }

    public boolean isTokenValid(String token, AppUserPrincipal principal) {
        Claims claims = extractClaims(token);
        return principal.getUsername().equals(claims.getSubject()) && claims.getExpiration().after(new Date());
    }

    private Claims extractClaims(String token) {
        return Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    private SecretKey getSigningKey() {
        byte[] keyBytes = Decoders.BASE64.decode(java.util.Base64.getEncoder()
                .encodeToString(properties.jwt().secret().getBytes(StandardCharsets.UTF_8)));
        return Keys.hmacShaKeyFor(keyBytes);
    }
}
