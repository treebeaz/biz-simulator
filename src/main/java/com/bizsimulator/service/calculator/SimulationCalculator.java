package com.bizsimulator.service.calculator;

import com.bizsimulator.dto.simulation.*;
import com.bizsimulator.entity.room.RoomSettings;
import com.bizsimulator.entity.simulation.GameState;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

/**
 * Класс-оркестратор всех калькуляторов
 */
@Component
@RequiredArgsConstructor
public class SimulationCalculator {

    private final DemandCalculatorImpl demandCalculator;
    private final FinanceCalculatorImpl financeCalculator;
    private final SalesCalculatorImpl salesCalculator;

    /**
     * Подготавливает все данные для сервиса
     *
     * @param gameState
     * @param settings
     * @param makeTurnRequestDto
     * @param activeEventFactors
     * @return SimulationResult
     */
    public SimulationResultDto calculate(GameState gameState,
                                         RoomSettings settings,
                                         MakeTurnRequestDto makeTurnRequestDto,
                                         ActiveEventFactorsDto activeEventFactors) {

        BigDecimal effectiveStaff = gameState.getStaff().multiply(activeEventFactors.getStaffMultiplier());
        BigDecimal effectiveCost = gameState.getCurrentCost().multiply(activeEventFactors.getCostMultiplier());
        BigDecimal effectiveBaseDemand = BigDecimal.valueOf(settings.getBaseDemand())
                .multiply(activeEventFactors.getDemandMultiplier());

        BigDecimal marketingFactor = BigDecimal.ONE;
        if(gameState.getLastMarketing().compareTo(BigDecimal.ZERO) > 0) {
            double ln = Math.log(1 + gameState.getLastMarketing().doubleValue());
            marketingFactor = BigDecimal.ONE.add(settings.getMarketingEfficiency().multiply(BigDecimal.valueOf(ln)));
        }


        int step = gameState.getStep() + 1;

        int demand = demandCalculator.calculateWithFactors(
                effectiveStaff,
                effectiveBaseDemand,
                marketingFactor,
                makeTurnRequestDto.getPrice(),
                settings.getAvgPrice(),
                settings.getElasticity().doubleValue()
        );

        int sales = salesCalculator.calculate(demand, gameState.getStock());

        FinanceResult financeResult = financeCalculator.calculateWithFactors(
                effectiveCost,
                gameState.getStaff(),
                settings,
                makeTurnRequestDto,
                sales
        );

        BigDecimal cashAfter = gameState.getCash()
                .add(financeResult.getProfit())
                .subtract(financeResult.getPurchaseCost());

        int stockAfter = gameState.getStock() - sales + makeTurnRequestDto.getPurchaseQuantity();

        BigDecimal staffAfter = gameState.getStaff().add(makeTurnRequestDto.getStaffChange());

        return SimulationResultDto.builder()
                .step(step)
                .demand(demand)
                .sales(sales)
                .revenue(financeResult.getRevenue())
                .variableCost(financeResult.getVariableCost())
                .purchaseCost(financeResult.getPurchaseCost())
                .salaryCost(financeResult.getSalaryCost())
                .totalCost(financeResult.getTotalCost())
                .profit(financeResult.getProfit())
                .cashAfter(cashAfter)
                .stockAfter(stockAfter)
                .staffAfter(staffAfter)
                .currentCostAfter(gameState.getCurrentCost())
                .lastMarketingAfter(makeTurnRequestDto.getMarketingExpense())
                .build();
    }
}
