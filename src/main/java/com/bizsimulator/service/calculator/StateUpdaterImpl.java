package com.bizsimulator.service.calculator;

import com.bizsimulator.dto.simulation.MakeTurnRequestDto;
import com.bizsimulator.dto.simulation.SimulationResultDto;
import com.bizsimulator.entity.simulation.GameState;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

@Component
public class StateUpdaterImpl implements StateUpdater {

    @Override
    public GameState apply(GameState gameState, SimulationResultDto simulationResult, MakeTurnRequestDto makeTurnRequestDto) {
        gameState.setStep(simulationResult.getStep());
        gameState.setCash(simulationResult.getCashAfter());
        gameState.setStock(simulationResult.getStockAfter());

        BigDecimal newStaff = simulationResult.getStaffAfter();
        if (newStaff.compareTo(BigDecimal.valueOf(0.1)) <= 0) {
            newStaff = BigDecimal.valueOf(0.1);
        }
        gameState.setStaff(newStaff);

        gameState.setCurrentCost(simulationResult.getCurrentCostAfter());
        gameState.setLastMarketing(makeTurnRequestDto.getMarketingExpense());

        return gameState;
    }
}
