package com.bizsimulator.entity.sim;

import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class RoomSimResponseDto {
    String roomId;
    String roomName;
    Integer dayDurationSeconds;
    Integer endDay;
}
