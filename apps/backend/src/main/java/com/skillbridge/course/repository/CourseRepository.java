package com.skillbridge.course.repository;

import com.skillbridge.course.entity.Course;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;

public interface CourseRepository extends JpaRepository<Course, Long> {

    @Override
    @EntityGraph(attributePaths = {"category", "provider", "skills"})
    List<Course> findAll();

    @EntityGraph(attributePaths = {"category", "provider", "skills"})
    List<Course> findByPublishedTrueOrderByTitleAsc();

    @EntityGraph(attributePaths = {"category", "provider", "skills"})
    List<Course> findDistinctByPublishedTrueAndSkillsIdInOrderByTitleAsc(Collection<Long> skillIds);

    @Query(
            value = """
                    select c.id
                    from courses c
                    left join categories category on category.id = c.category_id
                    left join providers provider on provider.id = c.provider_id
                    left join course_skills cs on cs.course_id = c.id
                    left join skills skill on skill.id = cs.skill_id
                    where (:publishedOnly = false or c.published = true)
                      and (
                        cast(:query as text) is null or cast(:query as text) = '' or
                        c.title ilike concat('%', cast(:query as text), '%') or
                        c.description ilike concat('%', cast(:query as text), '%') or
                        category.name ilike concat('%', cast(:query as text), '%') or
                        provider.name ilike concat('%', cast(:query as text), '%') or
                        skill.name ilike concat('%', cast(:query as text), '%')
                      )
                      and (:categoryId is null or c.category_id = :categoryId)
                      and (:providerId is null or c.provider_id = :providerId)
                      and (:skillId is null or skill.id = :skillId)
                      and (cast(:level as text) is null or cast(:level as text) = '' or c.level = cast(:level as text))
                    group by c.id, c.title, c.popularity_score
                    order by
                      case when cast(:sort as text) = 'popularity' then c.popularity_score else 0 end desc,
                      lower(c.title) asc
                    """,
            countQuery = """
                    select count(distinct c.id)
                    from courses c
                    left join categories category on category.id = c.category_id
                    left join providers provider on provider.id = c.provider_id
                    left join course_skills cs on cs.course_id = c.id
                    left join skills skill on skill.id = cs.skill_id
                    where (:publishedOnly = false or c.published = true)
                      and (
                        cast(:query as text) is null or cast(:query as text) = '' or
                        c.title ilike concat('%', cast(:query as text), '%') or
                        c.description ilike concat('%', cast(:query as text), '%') or
                        category.name ilike concat('%', cast(:query as text), '%') or
                        provider.name ilike concat('%', cast(:query as text), '%') or
                        skill.name ilike concat('%', cast(:query as text), '%')
                      )
                      and (:categoryId is null or c.category_id = :categoryId)
                      and (:providerId is null or c.provider_id = :providerId)
                      and (:skillId is null or skill.id = :skillId)
                      and (cast(:level as text) is null or cast(:level as text) = '' or c.level = cast(:level as text))
                    """,
            nativeQuery = true
    )
    Page<Long> searchCourseIds(
            @Param("publishedOnly") boolean publishedOnly,
            @Param("query") String query,
            @Param("categoryId") Long categoryId,
            @Param("providerId") Long providerId,
            @Param("skillId") Long skillId,
            @Param("level") String level,
            @Param("sort") String sort,
            Pageable pageable
    );

    @EntityGraph(attributePaths = {"category", "provider", "skills"})
    List<Course> findDistinctByIdIn(Collection<Long> ids);
}
