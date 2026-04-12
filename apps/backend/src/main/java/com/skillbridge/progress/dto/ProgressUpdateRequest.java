package com.skillbridge.progress.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;

public record ProgressUpdateRequest(
        @NotBlank String status,
        @Min(0) @Max(100) int progressPercent
) {
}
