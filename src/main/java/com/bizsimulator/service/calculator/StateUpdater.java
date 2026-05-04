package com.bizsimulator.service.calculator;

import com.bizsimulator.dto.simulation.MakeTurnRequestDto;
import com.bizsimulator.dto.simulation.SimulationResultDto;
import com.bizsimulator.entity.simulation.GameState;

public interface StateUpdater {
    GameState apply(GameState gameState,
                    SimulationResultDto simulationResult,
                    MakeTurnRequestDto makeTurnRequestDto);
}
