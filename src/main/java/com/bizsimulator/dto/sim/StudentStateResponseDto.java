package com.bizsimulator.dto.sim;

import lombok.Builder;
import lombok.Value;

import java.math.BigDecimal;

@Value
@Builder
public class StudentStateResponseDto {
    String studentId;
    BigDecimal cash;
    Integer stockUnits;
    BigDecimal price;
    BigDecimal marketingBudget;
    Integer juniorCount;
    Integer experiencedCount;
    BigDecimal cumulativeProfit;
    Boolean bankrupt;
}
