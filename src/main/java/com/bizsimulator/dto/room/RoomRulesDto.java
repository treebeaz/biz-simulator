package com.bizsimulator.dto.room;

import lombok.Builder;
import lombok.Value;

import java.math.BigDecimal;

@Value
@Builder
public class RoomRulesDto {
    BigDecimal rentPercent;
    BigDecimal marketingRefPercent;
    BigDecimal noiseMin;
    BigDecimal noiseMax;
}
