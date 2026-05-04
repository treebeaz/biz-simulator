package com.bizsimulator.dto.simulation;

import lombok.Builder;
import lombok.Value;

import java.math.BigDecimal;

@Value
@Builder
public class SimulationResultDto {
    Integer step;
    Integer demand;
    Integer sales;
    BigDecimal revenue;
    BigDecimal variableCost;
    BigDecimal purchaseCost;
    BigDecimal salaryCost;
    BigDecimal totalCost;
    BigDecimal profit;
    BigDecimal cashAfter;
    Integer stockAfter;
    BigDecimal staffAfter;
    BigDecimal currentCostAfter;
    BigDecimal lastMarketingAfter;
}
