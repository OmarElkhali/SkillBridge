package com.skillbridge.skill.dto;

import com.skillbridge.skill.entity.Skill;

public record SkillResponse(Long id, String name, String slug, String description) {
    public static SkillResponse from(Skill skill) {
        return new SkillResponse(skill.getId(), skill.getName(), skill.getSlug(), skill.getDescription());
    }
}
