package com.skillbridge.bigdata.dto;

import java.util.List;

public record BigDataRefreshResponse(
        boolean canRunAutomatically,
        String reason,
        List<String> commands
) {
}
