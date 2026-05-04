package com.bizsimulator.service.calculator;

import org.springframework.stereotype.Component;

/**
 * Класс для определения фактической продажи.
 */
@Component
public class SalesCalculatorImpl implements SalesCalculator {

    /**
     * Функция подсчета фактической продажи
     *
     * @param demand
     * @param stock
     * @return фактическая продажа
     */
    @Override
    public int calculate(int demand, int stock) {
        return Math.min(demand, stock);
    }
}
