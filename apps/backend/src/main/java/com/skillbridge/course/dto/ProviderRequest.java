package com.skillbridge.course.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ProviderRequest(
        @NotBlank @Size(max = 120) String name,
        @Size(max = 255) String websiteUrl,
        @Size(max = 500) String description
) {
}
