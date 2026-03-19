package com.bizsimulator.dto.room;

import lombok.Builder;
import lombok.Value;

import java.math.BigDecimal;

@Value
@Builder
public class RoomResponseDto {
    String roomId;
    String teacherId;
    String groupId;
    String roomName;
    String businessType;
    String roomStatus;
    BigDecimal initialBudget;
    Integer startDay;
    Integer endDay;
    Integer duration;
    RoomRulesDto roomRules;
}
