package com.bizsimulator.util;

import com.bizsimulator.config.BusinessProperties;
import com.bizsimulator.entity.room.RoomSettings;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class DefaultSettingsProvider {
    private final BusinessProperties businessProperties;

    public RoomSettings getForCoffeeShop(UUID roomId, BigDecimal startCash) {
        BusinessProperties.CoffeeShop properties =  businessProperties.getCoffeeShop();
        return RoomSettings.builder()
                .roomId(roomId)
                .startCash(startCash)
                .startStock(properties.getStartStock())
                .startStaff(properties.getStartStaff())
                .startCost(properties.getStartCost())
                .baseDemand(properties.getBaseDemand())
                .avgPrice(properties.getAvgPrice())
                .elasticity(properties.getElasticity())
                .marketingEfficiency(properties.getMarketingEfficiency())
                .fixedCost(properties.getFixedCost())
                .salaryPerStaff(properties.getSalaryPerStaff())
                .eventProbability(properties.getEventProbability())
                .build();
    }
}
