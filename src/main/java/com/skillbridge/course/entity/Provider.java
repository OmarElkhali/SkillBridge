package com.skillbridge.course.entity;

import com.skillbridge.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "providers")
public class Provider extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 120)
    private String name;

    @Column(length = 255)
    private String websiteUrl;

    @Column(length = 500)
    private String description;

    public Provider(String name, String websiteUrl, String description) {
        this.name = name;
        this.websiteUrl = websiteUrl;
        this.description = description;
    }
}
