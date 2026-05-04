package com.bizsimulator.service.calculator;

import com.bizsimulator.entity.simulation.GameState;

public interface SalesCalculator {
    int calculate(int demand, int stock);
}
