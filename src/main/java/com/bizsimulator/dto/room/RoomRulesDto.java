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
    Integer cap0;
    Integer staffSlots;
    Integer experiencedCapacity;
    Integer juniorCapacity;
    BigDecimal experiencedSalaryMonth;
    BigDecimal juniorSalaryMonth;
}
