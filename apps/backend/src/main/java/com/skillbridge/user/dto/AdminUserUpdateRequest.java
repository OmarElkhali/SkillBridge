package com.skillbridge.user.dto;

public record AdminUserUpdateRequest(
        String role,
        Boolean active
) {
}
