package com.skillbridge.skill.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record SkillRequest(
        @NotBlank @Size(max = 120) String name,
        @Size(max = 500) String description
) {
}
