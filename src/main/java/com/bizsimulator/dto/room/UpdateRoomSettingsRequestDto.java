package com.bizsimulator.dto.room;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Builder;
import lombok.Value;

import java.math.BigDecimal;

@Value
@Builder
public class UpdateRoomSettingsRequestDto {
    @Min(0)
    Integer startStock;


    @DecimalMin("0.01")
    BigDecimal startStaff;

    @DecimalMin("0.00")
    BigDecimal startCost;

    @Min(0)
    Integer baseDemand;

    @DecimalMin("0.01")
    BigDecimal avgPrice;

    @DecimalMin("0.01")
    BigDecimal elasticity;

    @DecimalMin("0.00")
    BigDecimal marketingEfficiency;

    @DecimalMin("0.00")
    BigDecimal fixedCost;

    @DecimalMin("0.00")
    BigDecimal salaryPerStaff;

    @DecimalMin("0.00")
    @DecimalMax("1.00")
    BigDecimal eventProbability;

}
