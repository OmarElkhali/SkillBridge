package com.skillbridge.projectidea.entity;

import com.skillbridge.course.entity.Course;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
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
@Table(name = "recommendation_results")
public class RecommendationResult {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "snapshot_id", nullable = false)
    private RecommendationSnapshot snapshot;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "course_id", nullable = false)
    private Course course;

    @Column(nullable = false)
    private int score;

    @Column(nullable = false)
    private int rankPosition;

    @Column(nullable = false)
    private int titleMatchScore;

    @Column(nullable = false)
    private int skillMatchScore;

    @Column(nullable = false)
    private int categoryMatchScore;

    @Column(nullable = false)
    private int bonusScore;

    @Column(columnDefinition = "TEXT")
    private String explanation;
}
