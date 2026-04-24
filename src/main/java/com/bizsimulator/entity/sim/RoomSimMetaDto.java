package com.bizsimulator.entity.sim;

import com.bizsimulator.dto.room.RoomRulesDto;
import lombok.Builder;
import lombok.Value;

import java.math.BigDecimal;

@Value
@Builder
public class RoomSimMetaDto {
    BigDecimal minPrice;
    BigDecimal unitPurchaseCost;
    BigDecimal refPrice;
    BigDecimal elasticity;
    Integer baseDemand;
    RoomRulesDto rules;
}
