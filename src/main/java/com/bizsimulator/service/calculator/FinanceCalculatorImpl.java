package com.bizsimulator.service.calculator;

import com.bizsimulator.dto.simulation.FinanceResult;
import com.bizsimulator.dto.simulation.MakeTurnRequestDto;
import com.bizsimulator.entity.room.RoomSettings;
import com.bizsimulator.entity.simulation.GameState;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

/**
 * Класс для подсчета финансовых показателей
 */
@Component
public class FinanceCalculatorImpl implements FinanceCalculator {

    /**
     * Функция подсчета финансовых показателей за 1 период t
     *
     * @param gameState
     * @param settings
     * @param requestDto
     * @param sales
     * @return FinanceResult
     */
    @Override
    public FinanceResult calculate(GameState gameState,
                                   RoomSettings settings,
                                   MakeTurnRequestDto requestDto,
                                   int sales) {
        BigDecimal revenue = requestDto.getPrice().multiply(BigDecimal.valueOf(sales));

        BigDecimal variableCost = gameState.getCurrentCost().multiply(BigDecimal.valueOf(sales));

        BigDecimal purchaseCost = gameState.getCurrentCost().multiply(
                BigDecimal.valueOf(requestDto.getPurchaseQuantity()));

        BigDecimal salaryCost = settings.getSalaryPerStaff().multiply(gameState.getStaff());

        BigDecimal totalCost = settings.getFixedCost()
                .add(variableCost)
                .add(requestDto.getMarketingExpense())
                .add(salaryCost);

        BigDecimal profit = revenue.subtract(totalCost);

        return new FinanceResult(
                revenue,
                variableCost,
                purchaseCost,
                salaryCost,
                totalCost,
                profit
        );
    }
}
