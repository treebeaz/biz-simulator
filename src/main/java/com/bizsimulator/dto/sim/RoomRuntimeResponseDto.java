package com.bizsimulator.dto.sim;

import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class RoomRuntimeResponseDto {
    String roomId;
    Integer currentDay;
    Boolean running;
    Integer speedMultiplayer;
    String startedAt;
    String finishedAt;
    Integer dayDurationSeconds;
    String lastTickAt;
}
