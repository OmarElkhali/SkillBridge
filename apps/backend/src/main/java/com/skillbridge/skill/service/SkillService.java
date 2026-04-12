package com.skillbridge.skill.service;

import com.skillbridge.common.exception.BadRequestException;
import com.skillbridge.common.exception.ResourceNotFoundException;
import com.skillbridge.skill.dto.SkillRequest;
import com.skillbridge.skill.dto.SkillResponse;
import com.skillbridge.skill.entity.Skill;
import com.skillbridge.skill.repository.SkillRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

@Service
@Transactional
public class SkillService {

    private final SkillRepository skillRepository;

    public SkillService(SkillRepository skillRepository) {
        this.skillRepository = skillRepository;
    }

    @Transactional(readOnly = true)
    public List<SkillResponse> findAll() {
        return skillRepository.findAll().stream().map(SkillResponse::from).toList();
    }

    public SkillResponse create(SkillRequest request) {
        if (skillRepository.existsByNameIgnoreCase(request.name())) {
            throw new BadRequestException("Skill already exists.");
        }
        Skill skill = new Skill(request.name().trim(), request.description());
        return SkillResponse.from(skillRepository.save(skill));
    }

    public SkillResponse update(Long id, SkillRequest request) {
        Skill skill = getEntity(id);
        skill.setName(request.name().trim());
        skill.setDescription(request.description());
        return SkillResponse.from(skillRepository.save(skill));
    }

    public void delete(Long id) {
        skillRepository.delete(getEntity(id));
    }

    public Skill getEntity(Long id) {
        return skillRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Skill not found."));
    }

    public Set<Skill> findAllByIds(Set<Long> skillIds) {
        List<Skill> skills = skillRepository.findAllById(skillIds);
        if (skills.size() != skillIds.size()) {
            throw new BadRequestException("One or more skills were not found.");
        }
        return new LinkedHashSet<>(skills);
    }
}
