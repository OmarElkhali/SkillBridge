package com.skillbridge.skill.repository;

import com.skillbridge.skill.entity.Skill;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface SkillRepository extends JpaRepository<Skill, Long> {
    boolean existsByNameIgnoreCase(String name);

    List<Skill> findByNameInIgnoreCase(List<String> names);

    @Query(value = """
            select s.*
            from skills s
            where (
                cast(:query as text) is null
                or cast(:query as text) = ''
                or s.name ilike concat('%', cast(:query as text), '%')
                or coalesce(s.description, '') ilike concat('%', cast(:query as text), '%')
            )
            order by lower(s.name) asc
            """,
            countQuery = """
            select count(*)
            from skills s
            where (
                cast(:query as text) is null
                or cast(:query as text) = ''
                or s.name ilike concat('%', cast(:query as text), '%')
                or coalesce(s.description, '') ilike concat('%', cast(:query as text), '%')
            )
            """,
            nativeQuery = true)
    Page<Skill> search(@Param("query") String query, Pageable pageable);
}
