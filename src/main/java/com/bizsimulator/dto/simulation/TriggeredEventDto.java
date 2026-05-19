package com.bizsimulator.dto.simulation;

import lombok.Builder;
import lombok.Value;

import java.math.BigDecimal;

@Value
@Builder
public class TriggeredEventDto {
    String name;
    String description;
    String effectType;
    BigDecimal effectValue;
    Integer duration;
    BigDecimal cashDelta;
}
