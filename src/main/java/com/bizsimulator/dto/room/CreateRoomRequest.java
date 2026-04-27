package com.bizsimulator.dto.room;

import com.bizsimulator.entity.enums.BusinessType;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Builder;
import lombok.Value;

import java.math.BigDecimal;

@Value
@Builder
public class CreateRoomRequest {
    String name;

    @NotNull
    @Positive
    BigDecimal startCash;

    BusinessType businessType;
}
