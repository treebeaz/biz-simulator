package com.bizsimulator.dto.simulation;

import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class EventApplyResultDto {
    InstantEffectDto instantEffect;
    TriggeredEventDto triggeredEvent;
}
