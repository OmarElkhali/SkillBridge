package com.skillbridge.bigdata.dto;

public record BigDataTraceResponse(
        boolean eventRecorded,
        String eventPath,
        String flumeHdfsPath,
        String message,
        boolean latestAnalyticsAvailable
) {
}
