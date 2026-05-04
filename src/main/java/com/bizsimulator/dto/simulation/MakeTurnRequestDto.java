package com.bizsimulator.dto.simulation;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.Builder;
import lombok.Value;

import java.math.BigDecimal;

@Value
@Builder
public class MakeTurnRequestDto {
    @NotNull
    @Positive
    BigDecimal price;

    @NotNull
    @PositiveOrZero
    Integer purchaseQuantity;

    @NotNull
    @PositiveOrZero
    BigDecimal marketingExpense;

    @NotNull
    BigDecimal staffChange;
}
