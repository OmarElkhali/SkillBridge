package com.skillbridge.user.dto;

import com.skillbridge.user.entity.User;

import java.time.Instant;

public record UserSummaryResponse(
        Long id,
        String firstName,
        String lastName,
        String email,
        String role,
        boolean active,
        Instant createdAt
) {
    public static UserSummaryResponse from(User user) {
        return new UserSummaryResponse(
                user.getId(),
                user.getFirstName(),
                user.getLastName(),
                user.getEmail(),
                user.getRole().getName().name(),
                user.isActive(),
                user.getCreatedAt()
        );
    }
}
