package com.skillbridge.user.dto;

public record AuthResponse(
        String accessToken,
        String tokenType,
        UserSummaryResponse user
) {
}
