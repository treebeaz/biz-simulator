package com.bizsimulator.dto.simulation;

import lombok.AllArgsConstructor;
import lombok.Value;

import java.math.BigDecimal;

@Value
@AllArgsConstructor
public class FinanceResult {
    BigDecimal revenue;
    BigDecimal variableCost;
    BigDecimal purchaseCost;
    BigDecimal salaryCost;
    BigDecimal totalCost;
    BigDecimal profit;
}
