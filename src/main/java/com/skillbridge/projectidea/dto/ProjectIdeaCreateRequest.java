package com.skillbridge.projectidea.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ProjectIdeaCreateRequest(
        @NotBlank @Size(max = 180) String title,
        @NotBlank String description
) {
}
