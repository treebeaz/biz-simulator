package com.bizsimulator.dto.simulation;

import lombok.Builder;
import lombok.Value;

import java.math.BigDecimal;

/**
 * DTO для мгновенного изменения денег
 */
@Value
@Builder
public class InstantEffectDto {
    BigDecimal cashDelta;
}
