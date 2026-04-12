package com.skillbridge.course.service;

import com.skillbridge.common.exception.BadRequestException;
import com.skillbridge.common.exception.ResourceNotFoundException;
import com.skillbridge.course.dto.CategoryRequest;
import com.skillbridge.course.dto.CategoryResponse;
import com.skillbridge.course.entity.Category;
import com.skillbridge.course.repository.CategoryRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class CategoryService {

    private final CategoryRepository categoryRepository;

    public CategoryService(CategoryRepository categoryRepository) {
        this.categoryRepository = categoryRepository;
    }

    @Transactional(readOnly = true)
    public List<CategoryResponse> findAll() {
        return categoryRepository.findAll().stream().map(CategoryResponse::from).toList();
    }

    public CategoryResponse create(CategoryRequest request) {
        if (categoryRepository.existsByNameIgnoreCase(request.name())) {
            throw new BadRequestException("Category already exists.");
        }
        Category category = new Category(request.name().trim(), request.description());
        return CategoryResponse.from(categoryRepository.save(category));
    }

    public CategoryResponse update(Long id, CategoryRequest request) {
        Category category = getEntity(id);
        category.setName(request.name().trim());
        category.setDescription(request.description());
        return CategoryResponse.from(categoryRepository.save(category));
    }

    public void delete(Long id) {
        categoryRepository.delete(getEntity(id));
    }

    public Category getEntity(Long id) {
        return categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found."));
    }
}
