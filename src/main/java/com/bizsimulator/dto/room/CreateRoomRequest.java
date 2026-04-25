package com.bizsimulator.dto.room;

import com.bizsimulator.entity.enums.BusinessType;
import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class CreateRoomRequest {
    String name;
    BusinessType businessType;
}
