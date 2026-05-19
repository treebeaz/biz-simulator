package com.bizsimulator.dto.simulation;

import lombok.Builder;
import lombok.Value;

import java.math.BigDecimal;

/**
 * Возврат текущих активных множителей
 */
@Value
@Builder
public class ActiveEventFactorsDto {
    BigDecimal staffMultiplier;
    BigDecimal costMultiplier;
    BigDecimal demandMultiplier;
}
