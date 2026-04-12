package com.skillbridge.projectidea.entity;

import com.skillbridge.common.entity.BaseEntity;
import com.skillbridge.skill.entity.Skill;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "project_detected_skills")
public class ProjectDetectedSkill extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "project_idea_id", nullable = false)
    private ProjectIdea projectIdea;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "skill_id", nullable = false)
    private Skill skill;

    @Column(nullable = false, length = 120)
    private String matchedKeyword;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private MatchSource matchSource;

    @Column(nullable = false)
    private double confidenceScore;
}
