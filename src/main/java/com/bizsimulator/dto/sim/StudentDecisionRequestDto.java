package com.bizsimulator.dto.sim;

import lombok.Builder;
import lombok.Value;

import java.math.BigDecimal;
import java.util.UUID;

@Value
@Builder
public class StudentDecisionRequestDto {
    UUID roomId;
    BigDecimal price;
    Integer purchaseUnits;
    BigDecimal marketingBudget;
    Integer hireJunior;
    Integer fireJunior;
    Integer hireExperienced;
    Integer fireExperienced;
}
