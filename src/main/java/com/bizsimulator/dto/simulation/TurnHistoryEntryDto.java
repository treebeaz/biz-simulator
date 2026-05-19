package com.bizsimulator.dto.simulation;

import lombok.Builder;
import lombok.Value;

import java.math.BigDecimal;
import java.util.UUID;

@Value
@Builder
public class TurnHistoryEntryDto {
    UUID id;
    UUID roomParticipantId;
    Integer step;
    BigDecimal price;
    Integer purchaseQuantity;
    BigDecimal marketingExpense;
    BigDecimal staffChange;
    Integer demand;
    Integer sales;
    BigDecimal revenue;
    BigDecimal salaryCost;
    BigDecimal variableCost;
    BigDecimal purchaseCost;
    BigDecimal totalCost;
    BigDecimal profit;
    BigDecimal cashAfter;
    Integer stockAfter;
    BigDecimal staffAfter;
    BigDecimal currentCostAfter;
    BigDecimal lastMarketingAfter;
}
