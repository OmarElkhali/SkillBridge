package com.skillbridge.security;

import com.skillbridge.common.exception.BadRequestException;
import com.skillbridge.config.AppProperties;
import org.springframework.security.oauth2.core.OAuth2Error;
import org.springframework.security.oauth2.core.OAuth2TokenValidator;
import org.springframework.security.oauth2.core.OAuth2TokenValidatorResult;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.stereotype.Service;

import java.util.Arrays;
import java.util.LinkedHashSet;
import java.util.Locale;
import java.util.Set;

@Service
public class GoogleTokenVerifierService {

    private static final String GOOGLE_ISSUER = "https://accounts.google.com";
    private static final String GOOGLE_ISSUER_ALT = "accounts.google.com";
    private static final String GOOGLE_JWK_SET_URI = "https://www.googleapis.com/oauth2/v3/certs";
    private static final OAuth2Error INVALID_AUDIENCE = new OAuth2Error("invalid_token", "Google token audience is not allowed.", null);
    private static final OAuth2Error INVALID_ISSUER = new OAuth2Error("invalid_token", "Google token issuer is invalid.", null);

    private final JwtDecoder jwtDecoder;
    private final Set<String> allowedAudiences;

    public GoogleTokenVerifierService(AppProperties appProperties) {
        this.allowedAudiences = parseAllowedAudiences(appProperties);
        NimbusJwtDecoder decoder = NimbusJwtDecoder.withJwkSetUri(GOOGLE_JWK_SET_URI).build();
        OAuth2TokenValidator<Jwt> withIssuer = jwt -> {
            String issuer = jwt.getIssuer() == null ? null : jwt.getIssuer().toString();
            if (GOOGLE_ISSUER.equals(issuer) || GOOGLE_ISSUER_ALT.equals(issuer)) {
                return OAuth2TokenValidatorResult.success();
            }
            return OAuth2TokenValidatorResult.failure(INVALID_ISSUER);
        };
        OAuth2TokenValidator<Jwt> audienceValidator = jwt -> {
            String audience = jwt.getAudience().isEmpty() ? null : jwt.getAudience().getFirst();
            if (audience != null && this.allowedAudiences.contains(audience)) {
                return OAuth2TokenValidatorResult.success();
            }
            return OAuth2TokenValidatorResult.failure(INVALID_AUDIENCE);
        };
        decoder.setJwtValidator(new org.springframework.security.oauth2.core.DelegatingOAuth2TokenValidator<>(withIssuer, audienceValidator));
        this.jwtDecoder = decoder;
    }

    public GoogleIdentity verify(String idToken) {
        if (allowedAudiences.isEmpty()) {
            throw new BadRequestException("Google OAuth is not configured on the server.");
        }
        if (idToken == null || idToken.isBlank()) {
            throw new BadRequestException("Google token is required.");
        }
        Jwt jwt;
        try {
            jwt = jwtDecoder.decode(idToken);
        } catch (RuntimeException ex) {
            throw new BadRequestException("Invalid Google token.");
        }

        String email = stringClaim(jwt, "email");
        Boolean emailVerified = jwt.getClaim("email_verified");
        if (email == null || email.isBlank() || !Boolean.TRUE.equals(emailVerified)) {
            throw new BadRequestException("Google account email must be verified.");
        }

        String givenName = stringClaim(jwt, "given_name");
        String familyName = stringClaim(jwt, "family_name");
        String fullName = stringClaim(jwt, "name");

        return new GoogleIdentity(
                email.trim().toLowerCase(Locale.ROOT),
                normalizeName(givenName, fullName, "Google"),
                normalizeName(familyName, null, "User")
        );
    }

    private String stringClaim(Jwt jwt, String key) {
        Object value = jwt.getClaims().get(key);
        return value instanceof String stringValue ? stringValue : null;
    }

    private String normalizeName(String primary, String fallbackFullName, String fallback) {
        if (primary != null && !primary.isBlank()) {
            return primary.trim();
        }
        if (fallbackFullName != null && !fallbackFullName.isBlank()) {
            String[] parts = fallbackFullName.trim().split("\\s+");
            if (parts.length > 0 && !parts[0].isBlank()) {
                return parts[0].trim();
            }
        }
        return fallback;
    }

    private Set<String> parseAllowedAudiences(AppProperties appProperties) {
        String raw = appProperties.oauth() != null && appProperties.oauth().google() != null
                ? appProperties.oauth().google().allowedAudiences()
                : null;
        if (raw == null || raw.isBlank()) {
            return Set.of();
        }
        Set<String> audiences = Arrays.stream(raw.split(","))
                .map(String::trim)
                .filter(value -> !value.isBlank())
                .collect(java.util.stream.Collectors.toCollection(LinkedHashSet::new));
        return audiences;
    }

    public record GoogleIdentity(
            String email,
            String firstName,
            String lastName
    ) {
    }
}
