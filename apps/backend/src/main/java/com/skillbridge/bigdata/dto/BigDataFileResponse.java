package com.skillbridge.bigdata.dto;

import java.time.Instant;

public record BigDataFileResponse(
        String name,
        String path,
        boolean available,
        long sizeBytes,
        Instant lastModified
) {
}
