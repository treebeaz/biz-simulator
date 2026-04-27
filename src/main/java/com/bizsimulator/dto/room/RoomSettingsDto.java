package com.bizsimulator.dto.room;

import lombok.Builder;
import lombok.Value;

import java.math.BigDecimal;
import java.util.UUID;

@Value
@Builder
public class RoomSettingsDto {
    UUID roomId;
    BigDecimal startCash;
    Integer startStock;
    BigDecimal startStaff;
    BigDecimal startCost;
    Integer baseDemand;
    BigDecimal avgPrice;
    BigDecimal elasticity;
    BigDecimal marketingEfficiency;
    BigDecimal fixedCost;
    BigDecimal salaryPerStaff;
    BigDecimal eventProbability;

}
