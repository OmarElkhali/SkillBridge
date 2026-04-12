package com.skillbridge.course.repository;

import com.skillbridge.course.entity.Provider;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProviderRepository extends JpaRepository<Provider, Long> {
    boolean existsByNameIgnoreCase(String name);
}
