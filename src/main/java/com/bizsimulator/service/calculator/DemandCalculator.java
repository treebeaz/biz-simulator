package com.bizsimulator.service.calculator;

import com.bizsimulator.dto.simulation.MakeTurnRequestDto;
import com.bizsimulator.entity.room.RoomSettings;
import com.bizsimulator.entity.simulation.GameState;

public interface DemandCalculator {
    int calculate(GameState gameState,
                  RoomSettings settings,
                  MakeTurnRequestDto requestDto);
}
