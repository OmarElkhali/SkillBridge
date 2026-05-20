package com.skillbridge.security;

import com.skillbridge.config.AppProperties;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Locale;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class LoginAttemptService {

    private final AppProperties appProperties;
    private final Map<String, AttemptState> attempts = new ConcurrentHashMap<>();

    public LoginAttemptService(AppProperties appProperties) {
        this.appProperties = appProperties;
    }

    public boolean isBlocked(String email, String clientIp) {
        String key = key(email, clientIp);
        AttemptState state = attempts.get(key);
        if (state == null) {
            return false;
        }

        Instant now = Instant.now();
        if (state.blockedUntil != null && state.blockedUntil.isAfter(now)) {
            return true;
        }

        if (state.blockedUntil != null && !state.blockedUntil.isAfter(now)) {
            state.blockedUntil = null;
            state.failures = 0;
        }

        if (state.lastFailureAt != null && state.lastFailureAt.isBefore(now.minusSeconds(attemptWindowSeconds()))) {
            attempts.remove(key);
        }
        return false;
    }

    public void recordFailure(String email, String clientIp) {
        String key = key(email, clientIp);
        AttemptState state = attempts.computeIfAbsent(key, ignored -> new AttemptState());
        Instant now = Instant.now();

        if (state.lastFailureAt == null || state.lastFailureAt.isBefore(now.minusSeconds(attemptWindowSeconds()))) {
            state.failures = 0;
            state.blockedUntil = null;
        }

        state.lastFailureAt = now;
        state.failures++;
        if (state.failures >= maxAttempts()) {
            state.failures = 0;
            state.blockedUntil = now.plusSeconds(lockSeconds());
        }
    }

    public void recordSuccess(String email, String clientIp) {
        attempts.remove(key(email, clientIp));
    }

    private String key(String email, String clientIp) {
        String normalizedEmail = email == null ? "unknown" : email.trim().toLowerCase(Locale.ROOT);
        String normalizedIp = clientIp == null || clientIp.isBlank() ? "unknown" : clientIp.trim();
        return normalizedEmail + "|" + normalizedIp;
    }

    private int maxAttempts() {
        AppProperties.Security security = appProperties.security();
        if (security == null) {
            return 5;
        }
        return Math.max(1, security.maxLoginAttempts());
    }

    private long lockSeconds() {
        AppProperties.Security security = appProperties.security();
        if (security == null) {
            return 15 * 60L;
        }
        return Math.max(1L, security.loginLockMinutes()) * 60;
    }

    private long attemptWindowSeconds() {
        AppProperties.Security security = appProperties.security();
        if (security == null) {
            return 15 * 60L;
        }
        return Math.max(1L, security.loginAttemptWindowMinutes()) * 60;
    }

    private static final class AttemptState {
        private int failures;
        private Instant blockedUntil;
        private Instant lastFailureAt;
    }
}
