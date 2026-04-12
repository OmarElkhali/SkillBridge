package com.skillbridge.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app")
public record AppProperties(
        Jwt jwt,
        Cors cors,
        Bootstrap bootstrap
) {
    public record Jwt(String secret, long expirationMs) {}

    public record Cors(String allowedOrigins) {}

    public record Bootstrap(
            String adminEmail,
            String adminPassword,
            String adminFirstName,
            String adminLastName
    ) {}
}
