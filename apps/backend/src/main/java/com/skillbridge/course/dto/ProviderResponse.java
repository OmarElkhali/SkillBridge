package com.skillbridge.course.dto;

import com.skillbridge.course.entity.Provider;

public record ProviderResponse(Long id, String name, String websiteUrl, String description) {
    public static ProviderResponse from(Provider provider) {
        return new ProviderResponse(provider.getId(), provider.getName(), provider.getWebsiteUrl(), provider.getDescription());
    }
}
