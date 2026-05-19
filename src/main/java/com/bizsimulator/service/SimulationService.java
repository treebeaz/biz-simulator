package com.bizsimulator.service;

import com.bizsimulator.dto.simulation.*;
import com.bizsimulator.entity.room.Room;
import com.bizsimulator.entity.room.RoomParticipant;
import com.bizsimulator.entity.room.RoomSettings;
import com.bizsimulator.entity.simulation.GameState;
import com.bizsimulator.entity.simulation.TurnHistory;
import com.bizsimulator.entity.user.User;
import com.bizsimulator.exception.room.RoomNotFoundException;
import com.bizsimulator.exception.room.RoomSettingsNotFoundException;
import com.bizsimulator.exception.simulation.GameStateNotFoundException;
import com.bizsimulator.exception.simulation.RoomParticipantNotFoundException;
import com.bizsimulator.repository.room.RoomParticipantRepository;
import com.bizsimulator.repository.room.RoomRepository;
import com.bizsimulator.repository.room.RoomSettingsRepository;
import com.bizsimulator.repository.simulation.ActiveEventRepository;
import com.bizsimulator.repository.simulation.GameStateRepository;
import com.bizsimulator.repository.simulation.TurnHistoryRepository;
import com.bizsimulator.service.calculator.SimulationCalculator;
import com.bizsimulator.service.calculator.StateUpdaterImpl;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;

@Service
@Slf4j
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class SimulationService {

    private static final Integer START_STEP_VALUE = 0;
    private static final Boolean IS_FINISHED_GAME = Boolean.TRUE;
    private static final String MAX_TURNS_REASON = "MAX_TURN";
    private static final String BANKRUPT_REASON = "BANKRUPT";

    private final RoomParticipantRepository roomParticipantRepository;
    private final RoomRepository roomRepository;
    private final RoomSettingsRepository roomSettingsRepository;
    private final GameStateRepository gameStateRepository;
    private final TurnHistoryRepository turnHistoryRepository;
    private final ActiveEventRepository activeEventRepository;

    private final SimulationCalculator calculator;
    private final StateUpdaterImpl stateUpdater;

    private final UserService userService;
    private final EventService eventService;

    /**
     * Создать начальное состояние симуляции при присоединении студента к комнате
     *
     * @param roomParticipantId
     */
    @Transactional
    public void initGameState(UUID roomParticipantId) {
        RoomParticipant roomParticipant = roomParticipantRepository.findById(roomParticipantId)
                .orElseThrow(() -> {
                    log.error("SimulationService.initGameState.Error: Room participant with id {} not found", roomParticipantId);
                    return new RoomParticipantNotFoundException("Room participant not found");
                });

        Room room = roomRepository.findById(roomParticipant.getRoomId())
                .orElseThrow(() -> {
                    log.error("SimulationService.initGameState.Error: Room with id {} not found ", roomParticipant.getRoomId());
                    return new RoomNotFoundException("Room not found");
                });

        RoomSettings roomSettings = roomSettingsRepository.findByRoomId(room.getId())
                .orElseThrow(() -> {
                    log.error("SimulationService.initGameState.Error: Room settings for room name {} not found  ", room.getName());
                    return new RoomSettingsNotFoundException("Room settings not found");
                });

        GameState gameState = buildStartGameState(roomParticipant, roomSettings);
        gameStateRepository.save(gameState);
        log.info("SimulationService.initGameState.Success: Game State initialized for participant {}", roomParticipant.getId());
    }

    /**
     * Создать объект GameState с начальными параметрами.
     *
     * @param participant
     * @param settings
     * @return GameState
     */
    private GameState buildStartGameState(RoomParticipant participant,
                                          RoomSettings settings) {
        return GameState.builder()
                .roomParticipantId(participant.getId())
                .step(START_STEP_VALUE)
                .cash(settings.getStartCash())
                .stock(settings.getStartStock())
                .staff(settings.getStartStaff())
                .currentCost(settings.getStartCost())
                .lastMarketing(BigDecimal.ZERO)
                .build();
    }

    /**
     * Расчет одного хода в симуляции.
     *
     * @param roomId
     * @param requestDto
     * @param authentication
     * @return TurnResultDto
     */
    @Transactional
    public TurnResultDto makeTurn(UUID roomId,
                                  MakeTurnRequestDto requestDto,
                                  Authentication authentication) {
        User student = userService.getCurrentAuthenticationUser(authentication);
        RoomParticipant participant = roomParticipantRepository.findByRoomIdAndUserId(roomId, student.getId())
                .orElseThrow(() -> {
                    log.error("SimulationService.makeTurn.Error: Room participant with room id {} and user id {} not found", roomId, student.getId());
                    return new RoomParticipantNotFoundException("Room participant not found");
                });

        GameState gameState = gameStateRepository.findByRoomParticipantId(participant.getId())
                .orElseThrow(() -> {
                    log.error("SimulationService.makeTurn.Error: Game state with participant id {} not found", participant.getId());
                    return new GameStateNotFoundException("Game state not found");
                });

        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> {
                    log.error("SimulationService.makeTurn.Error: Room with id {} not found ", roomId);
                    return new RoomNotFoundException("Room not found");
                });

        RoomSettings settings = roomSettingsRepository.findByRoomId(room.getId())
                .orElseThrow(() -> {
                    log.error("SimulationService.makeTurn.Error: Room settings for room with id {} not found", room.getId());
                    return new RoomSettingsNotFoundException("Room settings not found");
                });

        if (gameState.getStep() >= room.getMaxTurns()) {
            return buildTurnResult(gameState, IS_FINISHED_GAME, MAX_TURNS_REASON, null);
        }
        if (gameState.getCash().compareTo(BigDecimal.ZERO) < 0) {
            return buildTurnResult(gameState, IS_FINISHED_GAME, BANKRUPT_REASON, null);
        }

        ActiveEventFactorsDto activeEventFactors = eventService.getActiveFactors(participant.getId());

        Optional<EventApplyResultDto> eventResult = eventService.generateAndApplyEffect(
                roomId, participant.getId(), settings.getEventProbability()
        );

        if (eventResult.isPresent() && eventResult.get().getInstantEffect() != null) {
            BigDecimal newCash = gameState.getCash().add(
                    eventResult.get().getInstantEffect().getCashDelta()
            );
            gameState.setCash(newCash);
            gameStateRepository.save(gameState);
            log.info("Instant cash effect: {} → {}",
                    eventResult.get().getInstantEffect().getCashDelta(), newCash);
        }

        SimulationResultDto result = calculator.calculate(gameState, settings, requestDto, activeEventFactors);
        TurnHistory turnHistory = buildTurnHistory(participant, result, requestDto);
        turnHistoryRepository.save(turnHistory);

        stateUpdater.apply(gameState, result, requestDto);
        gameStateRepository.save(gameState);

        participant.setCurrentStep(result.getStep());
        roomParticipantRepository.save(participant);

        eventService.decrementActiveEvents(participant.getId());


        boolean gameFinished = false;
        String finishReason = null;
        if (result.getStep() >= room.getMaxTurns()) {
            gameFinished = true;
            finishReason = "MAX_TURNS";
        } else if (result.getCashAfter().compareTo(BigDecimal.ZERO) < 0) {
            gameFinished = true;
            finishReason = "BANKRUPT";
        }

        return buildTurnResult(gameState,
                gameFinished,
                finishReason,
                result,
                eventResult.map(EventApplyResultDto::getTriggeredEvent).orElse(null)
        );
    }

    /**
     * Получить текущее состояние игры
     *
     * @param roomId
     * @param authentication
     * @return TurnResultDto
     */
    @Transactional(readOnly = true)
    public TurnResultDto getCurrentState(UUID roomId, Authentication authentication) {
        var student = userService.getCurrentAuthenticationUser(authentication);
        var participant = roomParticipantRepository.findByRoomIdAndUserId(roomId, student.getId())
                .orElseThrow(() -> new RoomParticipantNotFoundException("Not a participant"));

        GameState gameState = gameStateRepository.findByRoomParticipantId(participant.getId())
                .orElseThrow(() -> new GameStateNotFoundException("GameState not found"));

        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new RoomNotFoundException("Room not found"));

        boolean finished = gameState.getStep() >= room.getMaxTurns() || gameState.getCash().compareTo(BigDecimal.ZERO) < 0;
        String finishReason = null;
        if (gameState.getStep() >= room.getMaxTurns()) {
            finishReason = "MAX_TURNS";
        } else if (gameState.getCash().compareTo(BigDecimal.ZERO) < 0) {
            finishReason = "BANKRUPT";
        }

        return TurnResultDto.builder()
                .step(gameState.getStep())
                .gameFinished(finished)
                .finishReason(finishReason)
                .cashAfter(gameState.getCash())
                .stockAfter(gameState.getStock())
                .build();
    }

    private TurnHistory buildTurnHistory(RoomParticipant participant,
                                         SimulationResultDto result,
                                         MakeTurnRequestDto requestDto) {
        return TurnHistory.builder()
                .roomParticipantId(participant.getId())
                .step(result.getStep())
                .price(requestDto.getPrice())
                .purchaseQuantity(requestDto.getPurchaseQuantity())
                .marketingExpense(requestDto.getMarketingExpense())
                .staffChange(requestDto.getStaffChange())
                .demand(result.getDemand())
                .sales(result.getSales())
                .revenue(result.getRevenue())
                .variableCost(result.getVariableCost())
                .purchaseCost(result.getPurchaseCost())
                .salaryCost(result.getSalaryCost())
                .totalCost(result.getTotalCost())
                .profit(result.getProfit())
                .cashAfter(result.getCashAfter())
                .stockAfter(result.getStockAfter())
                .staffAfter(result.getStaffAfter())
                .currentCostAfter(result.getCurrentCostAfter())
                .lastMarketingAfter(result.getLastMarketingAfter())
                .build();
    }


    private TurnResultDto buildTurnResult(GameState state,
                                          boolean finishedGame,
                                          String reason,
                                          SimulationResultDto simulationResultDto) {
        if (simulationResultDto == null) {
            return TurnResultDto.builder()
                    .step(state.getStep())
                    .gameFinished(finishedGame)
                    .finishReason(reason)
                    .cashAfter(state.getCash())
                    .stockAfter(state.getStock())
                    .build();
        }
        return TurnResultDto.builder()
                .step(state.getStep())
                .gameFinished(finishedGame)
                .finishReason(reason)
                .demand(simulationResultDto.getDemand())
                .sales(simulationResultDto.getSales())
                .revenue(simulationResultDto.getRevenue())
                .totalCost(simulationResultDto.getTotalCost())
                .profit(simulationResultDto.getProfit())
                .cashAfter(simulationResultDto.getCashAfter())
                .stockAfter(simulationResultDto.getStockAfter())
                .cashChange(simulationResultDto.getProfit().subtract(simulationResultDto.getPurchaseCost()))
                .build();
    }

    private TurnResultDto buildTurnResult(GameState state,
                                          boolean finishedGame,
                                          String reason,
                                          SimulationResultDto simulationResultDto,
                                          TriggeredEventDto triggeredEventDto) {
        return TurnResultDto.builder()
                .step(state.getStep())
                .gameFinished(finishedGame)
                .finishReason(reason)
                .demand(simulationResultDto.getDemand())
                .sales(simulationResultDto.getSales())
                .revenue(simulationResultDto.getRevenue())
                .totalCost(simulationResultDto.getTotalCost())
                .profit(simulationResultDto.getProfit())
                .cashAfter(simulationResultDto.getCashAfter())
                .stockAfter(simulationResultDto.getStockAfter())
                .cashChange(simulationResultDto.getProfit().subtract(simulationResultDto.getPurchaseCost()))
                .triggeredEventDto(triggeredEventDto)
                .build();
    }

    @Transactional
    public TurnResultDto resetGame(UUID roomId, Authentication authentication) {
        User student = userService.getCurrentAuthenticationUser(authentication);
        RoomParticipant participant = roomParticipantRepository.findByRoomIdAndUserId(roomId, student.getId())
                .orElseThrow(() -> {
                    log.error("SimulationService.resetGame.Error: Participant in room {} not found", roomId);
                    return new RoomParticipantNotFoundException("Room not found");
                });
        GameState gameState = gameStateRepository.findByRoomParticipantId(participant.getId())
                .orElseThrow(() -> {
                    log.error("SimulationService.resetGame.Error: Game state by participant  {} not found", participant.getId());
                    return new GameStateNotFoundException("Game state not found");
                });
        RoomSettings settings = roomSettingsRepository.findByRoomId(roomId)
                .orElseThrow(() -> {
                    log.error("SimulationService.resetGame.Error: Room settings by room {} not found", roomId);
                    return new RoomSettingsNotFoundException("Room settings not found");
                });

        turnHistoryRepository.deleteByRoomParticipantId(participant.getId());
        activeEventRepository.deleteByRoomParticipantId(participant.getId());

        gameState.setStep(0);
        gameState.setCash(settings.getStartCash());
        gameState.setStock(settings.getStartStock());
        gameState.setStaff(settings.getStartStaff());
        gameState.setCurrentCost(settings.getStartCost());
        gameState.setLastMarketing(BigDecimal.ZERO);

        gameStateRepository.save(gameState);
        participant.setCurrentStep(0);
        roomParticipantRepository.save(participant);

        return TurnResultDto.builder()
                .step(0)
                .gameFinished(false)
                .finishReason(null)
                .cashAfter(gameState.getCash())
                .stockAfter(gameState.getStock())
                .build();
    }

}
