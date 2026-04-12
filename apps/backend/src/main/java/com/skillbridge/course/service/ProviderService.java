package com.skillbridge.course.service;

import com.skillbridge.common.exception.BadRequestException;
import com.skillbridge.common.exception.ResourceNotFoundException;
import com.skillbridge.course.dto.ProviderRequest;
import com.skillbridge.course.dto.ProviderResponse;
import com.skillbridge.course.entity.Provider;
import com.skillbridge.course.repository.ProviderRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class ProviderService {

    private final ProviderRepository providerRepository;

    public ProviderService(ProviderRepository providerRepository) {
        this.providerRepository = providerRepository;
    }

    @Transactional(readOnly = true)
    public List<ProviderResponse> findAll() {
        return providerRepository.findAll().stream().map(ProviderResponse::from).toList();
    }

    public ProviderResponse create(ProviderRequest request) {
        if (providerRepository.existsByNameIgnoreCase(request.name())) {
            throw new BadRequestException("Provider already exists.");
        }
        Provider provider = new Provider(request.name().trim(), request.websiteUrl(), request.description());
        return ProviderResponse.from(providerRepository.save(provider));
    }

    public ProviderResponse update(Long id, ProviderRequest request) {
        Provider provider = getEntity(id);
        provider.setName(request.name().trim());
        provider.setWebsiteUrl(request.websiteUrl());
        provider.setDescription(request.description());
        return ProviderResponse.from(providerRepository.save(provider));
    }

    public void delete(Long id) {
        providerRepository.delete(getEntity(id));
    }

    public Provider getEntity(Long id) {
        return providerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Provider not found."));
    }
}
