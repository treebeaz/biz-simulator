package com.bizsimulator.service.calculator;

import com.bizsimulator.dto.simulation.FinanceResult;
import com.bizsimulator.dto.simulation.MakeTurnRequestDto;
import com.bizsimulator.entity.room.RoomSettings;
import com.bizsimulator.entity.simulation.GameState;

public interface FinanceCalculator {
    FinanceResult calculate(GameState gameState,
                            RoomSettings settings,
                            MakeTurnRequestDto requestDto,
                            int sales);
}
