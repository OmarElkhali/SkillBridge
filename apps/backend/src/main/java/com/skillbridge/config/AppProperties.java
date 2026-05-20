package com.skillbridge.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app")
public record AppProperties(
        Jwt jwt,
        Cors cors,
        Bootstrap bootstrap,
        Security security,
        Oauth oauth
) {
    public record Jwt(String secret, long expirationMs) {}

    public record Cors(String allowedOrigins) {}

    public record Bootstrap(
            String adminEmail,
            String adminPassword,
            String adminFirstName,
            String adminLastName
    ) {}

    public record Security(
            int maxLoginAttempts,
            long loginLockMinutes,
            long loginAttemptWindowMinutes
    ) {}

    public record Oauth(
            Google google,
            Github github
    ) {}

    public record Google(String allowedAudiences) {}

    public record Github(
            String clientId,
            String clientSecret,
            String redirectUri
    ) {}
}
