package com.skillbridge.skill.entity;

import com.skillbridge.common.entity.BaseEntity;
import com.skillbridge.common.util.SlugUtils;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "skills")
public class Skill extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 120)
    private String name;

    @Column(nullable = false, unique = true, length = 140)
    private String slug;

    @Column(length = 500)
    private String description;

    public Skill(String name, String description) {
        this.name = name;
        this.description = description;
    }

    @PrePersist
    @PreUpdate
    public void syncSlug() {
        this.slug = SlugUtils.toSlug(name);
    }
}
