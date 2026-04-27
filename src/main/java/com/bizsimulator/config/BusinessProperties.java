package com.bizsimulator.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

@Data
@Component
@ConfigurationProperties(prefix = "bizsimulator.business")
public class BusinessProperties {

    private CoffeeShop coffeeShop = new CoffeeShop();

    @Data
    public static class CoffeeShop {
        private Integer startStock;
        private BigDecimal startStaff;
        private BigDecimal startCost;
        private Integer baseDemand;
        private BigDecimal avgPrice;
        private BigDecimal elasticity;
        private BigDecimal marketingEfficiency;
        private BigDecimal fixedCost;
        private BigDecimal salaryPerStaff;
        private BigDecimal eventProbability;
    }
}
