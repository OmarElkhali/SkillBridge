package com.skillbridge.security;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.skillbridge.common.exception.BadRequestException;
import com.skillbridge.config.AppProperties;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Service
public class GithubOauthService {

    private static final String TOKEN_ENDPOINT = "https://github.com/login/oauth/access_token";
    private static final String USER_ENDPOINT = "https://api.github.com/user";
    private static final String USER_EMAILS_ENDPOINT = "https://api.github.com/user/emails";
    private static final String GITHUB_ACCEPT_HEADER = "application/vnd.github+json";
    private static final String GITHUB_API_VERSION = "2022-11-28";
    private static final String USER_AGENT = "SkillBridge";

    private final AppProperties appProperties;
    private final ObjectMapper objectMapper;
    private final HttpClient httpClient;

    public GithubOauthService(AppProperties appProperties, ObjectMapper objectMapper) {
        this.appProperties = appProperties;
        this.objectMapper = objectMapper;
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(10))
                .build();
    }

    public GithubIdentity authenticate(String code, String redirectUri) {
        ensureGithubConfigured();
        String normalizedRedirectUri = redirectUri == null ? "" : redirectUri.trim();
        if (!normalizedRedirectUri.equals(appProperties.oauth().github().redirectUri())) {
            throw new BadRequestException("GitHub OAuth redirect URI is not allowed.");
        }

        String accessToken = exchangeCodeForToken(code.trim(), normalizedRedirectUri);
        Map<String, Object> user = fetchGithubUser(accessToken);
        String email = resolveEmail(accessToken, user);
        String login = asString(user.get("login"));
        String name = asString(user.get("name"));

        return new GithubIdentity(
                email.toLowerCase(Locale.ROOT),
                firstNameFrom(name, login),
                lastNameFrom(name)
        );
    }

    private String exchangeCodeForToken(String code, String redirectUri) {
        String body = form(Map.of(
                "client_id", appProperties.oauth().github().clientId(),
                "client_secret", appProperties.oauth().github().clientSecret(),
                "code", code,
                "redirect_uri", redirectUri
        ));

        HttpRequest request = HttpRequest.newBuilder(URI.create(TOKEN_ENDPOINT))
                .timeout(Duration.ofSeconds(15))
                .header("Accept", "application/json")
                .header("Content-Type", "application/x-www-form-urlencoded")
                .POST(HttpRequest.BodyPublishers.ofString(body))
                .build();

        Map<String, Object> payload = sendJsonMap(request, "GitHub OAuth token exchange failed.");
        String error = asString(payload.get("error"));
        if (error != null && !error.isBlank()) {
            throw new BadRequestException("GitHub OAuth failed: " + error);
        }
        String accessToken = asString(payload.get("access_token"));
        if (accessToken == null || accessToken.isBlank()) {
            throw new BadRequestException("GitHub OAuth failed: no access token returned.");
        }
        return accessToken;
    }

    private Map<String, Object> fetchGithubUser(String accessToken) {
        HttpRequest request = HttpRequest.newBuilder(URI.create(USER_ENDPOINT))
                .timeout(Duration.ofSeconds(15))
                .header("Authorization", "Bearer " + accessToken)
                .header("Accept", GITHUB_ACCEPT_HEADER)
                .header("X-GitHub-Api-Version", GITHUB_API_VERSION)
                .header("User-Agent", USER_AGENT)
                .GET()
                .build();
        return sendJsonMap(request, "Unable to fetch GitHub user profile.");
    }

    private String resolveEmail(String accessToken, Map<String, Object> user) {
        String userEmail = asString(user.get("email"));
        if (userEmail != null && !userEmail.isBlank()) {
            return userEmail.trim();
        }

        HttpRequest request = HttpRequest.newBuilder(URI.create(USER_EMAILS_ENDPOINT))
                .timeout(Duration.ofSeconds(15))
                .header("Authorization", "Bearer " + accessToken)
                .header("Accept", GITHUB_ACCEPT_HEADER)
                .header("X-GitHub-Api-Version", GITHUB_API_VERSION)
                .header("User-Agent", USER_AGENT)
                .GET()
                .build();
        List<Map<String, Object>> emails = sendJsonList(request, "Unable to fetch GitHub user emails.");

        String primaryVerified = emails.stream()
                .filter(entry -> Boolean.TRUE.equals(entry.get("primary")) && Boolean.TRUE.equals(entry.get("verified")))
                .map(entry -> asString(entry.get("email")))
                .filter(value -> value != null && !value.isBlank())
                .findFirst()
                .orElse(null);
        if (primaryVerified != null) {
            return primaryVerified.trim();
        }

        String firstVerified = emails.stream()
                .filter(entry -> Boolean.TRUE.equals(entry.get("verified")))
                .map(entry -> asString(entry.get("email")))
                .filter(value -> value != null && !value.isBlank())
                .findFirst()
                .orElse(null);
        if (firstVerified == null) {
            throw new BadRequestException("GitHub account must have a verified email.");
        }
        return firstVerified.trim();
    }

    private Map<String, Object> sendJsonMap(HttpRequest request, String failureMessage) {
        try {
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                throw new BadRequestException(failureMessage);
            }
            return objectMapper.readValue(response.body(), new TypeReference<>() {});
        } catch (InterruptedException ex) {
            Thread.currentThread().interrupt();
            throw new BadRequestException(failureMessage);
        } catch (IOException ex) {
            throw new BadRequestException(failureMessage);
        }
    }

    private List<Map<String, Object>> sendJsonList(HttpRequest request, String failureMessage) {
        try {
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                throw new BadRequestException(failureMessage);
            }
            return objectMapper.readValue(response.body(), new TypeReference<>() {});
        } catch (InterruptedException ex) {
            Thread.currentThread().interrupt();
            throw new BadRequestException(failureMessage);
        } catch (IOException ex) {
            throw new BadRequestException(failureMessage);
        }
    }

    private void ensureGithubConfigured() {
        AppProperties.Github github = appProperties.oauth() == null ? null : appProperties.oauth().github();
        if (github == null
                || isBlank(github.clientId())
                || isBlank(github.clientSecret())
                || isBlank(github.redirectUri())) {
            throw new BadRequestException("GitHub OAuth is not configured on the server.");
        }
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }

    private String asString(Object value) {
        return value instanceof String stringValue ? stringValue : null;
    }

    private String firstNameFrom(String fullName, String loginFallback) {
        if (fullName != null && !fullName.isBlank()) {
            String[] parts = fullName.trim().split("\\s+");
            if (parts.length > 0 && !parts[0].isBlank()) {
                return parts[0];
            }
        }
        if (loginFallback != null && !loginFallback.isBlank()) {
            return loginFallback.trim();
        }
        return "GitHub";
    }

    private String lastNameFrom(String fullName) {
        if (fullName != null && !fullName.isBlank()) {
            String[] parts = fullName.trim().split("\\s+");
            if (parts.length > 1) {
                return String.join(" ", java.util.Arrays.copyOfRange(parts, 1, parts.length));
            }
        }
        return "User";
    }

    private String form(Map<String, String> values) {
        return values.entrySet().stream()
                .map(entry -> URLEncoder.encode(entry.getKey(), StandardCharsets.UTF_8)
                        + "="
                        + URLEncoder.encode(entry.getValue(), StandardCharsets.UTF_8))
                .collect(java.util.stream.Collectors.joining("&"));
    }

    public record GithubIdentity(
            String email,
            String firstName,
            String lastName
    ) {
    }
}
