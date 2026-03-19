package com.bizsimulator.dto.room;

import com.bizsimulator.entity.enums.BusinessType;
import lombok.Builder;
import lombok.Value;

import java.math.BigDecimal;
import java.util.UUID;

@Value
@Builder
public class RoomRequestDto {
    UUID groupId;
    String roomName;
    BusinessType businessType;
    BigDecimal initialBudget;
}
