package com.bizsimulator.dto.simulation;

import lombok.Builder;
import lombok.Value;

import java.math.BigDecimal;

@Value
@Builder
public class TurnResultDto {
    Integer step;
    boolean gameFinished;
    String finishReason;
    Integer demand;
    Integer sales;
    BigDecimal revenue;
    BigDecimal totalCost;
    BigDecimal profit;
    BigDecimal cashAfter;
    Integer stockAfter;
    BigDecimal cashChange;  // изменение денег за 1 ход
    TriggeredEventDto triggeredEventDto;
}


