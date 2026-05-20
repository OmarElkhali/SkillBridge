package com.skillbridge.security;

import com.skillbridge.config.AppProperties;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class LoginAttemptServiceTests {

    @Test
    void blocksAfterConfiguredFailures() {
        LoginAttemptService service = serviceWithLimits(3, 1, 15);
        String email = "user@example.com";
        String ip = "127.0.0.1";

        assertFalse(service.isBlocked(email, ip));
        service.recordFailure(email, ip);
        service.recordFailure(email, ip);
        assertFalse(service.isBlocked(email, ip));

        service.recordFailure(email, ip);
        assertTrue(service.isBlocked(email, ip));
    }

    @Test
    void clearsAttemptStateAfterSuccessfulLogin() {
        LoginAttemptService service = serviceWithLimits(3, 1, 15);
        String email = "user@example.com";
        String ip = "127.0.0.1";

        service.recordFailure(email, ip);
        service.recordFailure(email, ip);
        assertFalse(service.isBlocked(email, ip));

        service.recordSuccess(email, ip);
        assertFalse(service.isBlocked(email, ip));
    }

    private LoginAttemptService serviceWithLimits(int maxAttempts, long lockMinutes, long windowMinutes) {
        AppProperties properties = new AppProperties(
                new AppProperties.Jwt("change-this-secret-key-change-this-secret-key", 86400000),
                new AppProperties.Cors("http://localhost:5173"),
                new AppProperties.Bootstrap("admin@test.local", "Admin123!", "Test", "Admin"),
                new AppProperties.Security(maxAttempts, lockMinutes, windowMinutes),
                new AppProperties.Oauth(
                        new AppProperties.Google("test-google-client-id.apps.googleusercontent.com"),
                        new AppProperties.Github("test-github-client-id", "test-github-client-secret", "http://localhost:5173/login")
                )
        );
        return new LoginAttemptService(properties);
    }
}
