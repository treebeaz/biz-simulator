package com.bizsimulator.service.calculator;

import com.bizsimulator.dto.simulation.MakeTurnRequestDto;
import com.bizsimulator.entity.room.RoomSettings;
import com.bizsimulator.entity.simulation.GameState;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.security.SecureRandom;

/**
 * Класс для расчета спроса D_t.
 * Учитывает: цену товара относительно рыночной с эластичностью,
 * маркетинг прошлого периода, эффективность персонала, случайный шум
 */
@Component
public class DemandCalculatorImpl implements DemandCalculator {

    private static final double NOISE_MIN = 0.7;
    private static final double NOISE_MAX = 1.3;


    private final SecureRandom random = new SecureRandom();

    /**
     * Функция расчета спроса D_t
     *
     * @param gameState
     * @param settings
     * @param requestDto
     * @return целое число - сколько единиц товара хотят купить
     */
    @Override
    public int calculate(GameState gameState, RoomSettings settings, MakeTurnRequestDto requestDto) {
        double fPrice = Math.pow(
                requestDto.getPrice().doubleValue() / settings.getAvgPrice().doubleValue(),
                -settings.getElasticity().doubleValue()
        );

        double fMarketing = 1 + settings.getMarketingEfficiency().doubleValue() *
                                Math.log(1 + gameState.getLastMarketing().doubleValue());

        double noise = NOISE_MIN + (NOISE_MAX - NOISE_MIN) * random.nextDouble();

        double demand = settings.getBaseDemand() *
                        fPrice *
                        fMarketing *
                        gameState.getStaff().doubleValue() *
                        noise;

        return Math.max(0, (int) Math.round(demand));
    }

    public int calculateWithFactors(BigDecimal effectiveStaff,
                                    BigDecimal effectiveBaseDemand,
                                    BigDecimal marketingFactor,
                                    BigDecimal price,
                                    BigDecimal avgPrice,
                                    double elasticity) {
        double fPrice = Math.pow(price.doubleValue() / avgPrice.doubleValue(), -elasticity);
        double noise = NOISE_MIN + (NOISE_MAX - NOISE_MIN) * random.nextDouble();
        double demand = effectiveBaseDemand.doubleValue()
                * fPrice
                * marketingFactor.doubleValue()
                * effectiveStaff.doubleValue()
                *noise;

        return Math.max(0, (int) Math.round(demand));
    }
}
