package com.skillbridge.bigdata.dto;

import java.util.List;
import java.util.Map;

public record BigDataStatusResponse(
        List<BigDataFileResponse> files,
        Map<String, Object> catalogBuildReport,
        Map<String, Object> bigDataSummary,
        Map<String, Object> recommendationResult,
        List<Map<String, Object>> latestEvents,
        Map<String, Object> pipelineHealth,
        String flumeHdfsPath
) {
}
