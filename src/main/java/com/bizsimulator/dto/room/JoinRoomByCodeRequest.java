package com.bizsimulator.dto.room;

import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class JoinRoomByCodeRequest {
    String joinCode;
}
