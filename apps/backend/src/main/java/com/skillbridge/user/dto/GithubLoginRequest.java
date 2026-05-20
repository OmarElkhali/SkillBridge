package com.skillbridge.user.dto;

import jakarta.validation.constraints.NotBlank;

public record GithubLoginRequest(
        @NotBlank String code,
        @NotBlank String redirectUri
) {
}
