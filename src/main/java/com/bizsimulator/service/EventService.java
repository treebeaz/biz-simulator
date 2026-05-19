package com.bizsimulator.service;

import com.bizsimulator.dto.simulation.ActiveEventFactorsDto;
import com.bizsimulator.dto.simulation.EventApplyResultDto;
import com.bizsimulator.dto.simulation.InstantEffectDto;
import com.bizsimulator.dto.simulation.TriggeredEventDto;
import com.bizsimulator.entity.enums.BusinessType;
import com.bizsimulator.entity.enums.EffectType;
import com.bizsimulator.entity.room.Room;
import com.bizsimulator.entity.simulation.ActiveEvent;
import com.bizsimulator.entity.simulation.EventTemplate;
import com.bizsimulator.exception.room.RoomNotFoundException;
import com.bizsimulator.repository.room.RoomRepository;
import com.bizsimulator.repository.simulation.ActiveEventRepository;
import com.bizsimulator.repository.simulation.EventTemplateRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.security.SecureRandom;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.Optional;
import java.util.UUID;

@Service
@Slf4j
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class EventService {

    private final EventTemplateRepository eventTemplateRepository;
    private final ActiveEventRepository activeEventRepository;
    private final RoomRepository roomRepository;

    private final SecureRandom random = new SecureRandom();

    /**
     * Возврат текущих множителей.
     * Множители перемножаются, если активны несколько событий.
     *
     * @param roomParticipantId
     * @return ActiveEventFactorsDto
     */
    public ActiveEventFactorsDto getActiveFactors(UUID roomParticipantId) {
        List<ActiveEvent> activeEvents = activeEventRepository.findByRoomParticipantId(roomParticipantId);

        BigDecimal staffMultiplier = BigDecimal.ONE;
        BigDecimal costMultiplier = BigDecimal.ONE;
        BigDecimal demandMultiplier = BigDecimal.ONE;

        for (ActiveEvent activeEvent : activeEvents) {
            staffMultiplier = staffMultiplier.multiply(activeEvent.getMultiplierStaff());
            costMultiplier = costMultiplier.multiply(activeEvent.getMultiplierCost());
            demandMultiplier = demandMultiplier.multiply(activeEvent.getMultiplierDemand());
        }

        return ActiveEventFactorsDto.builder()
                .staffMultiplier(staffMultiplier)
                .costMultiplier(costMultiplier)
                .demandMultiplier(demandMultiplier)
                .build();
    }

    /**
     * Метод уменьшает количество оставшихся дней события.
     * Истекшие события удаляются.
     *
     * @param roomParticipantId
     */
    public void decrementActiveEvents(UUID roomParticipantId) {
        List<ActiveEvent> activeEvents = activeEventRepository.findByRoomParticipantId(roomParticipantId);

        for (ActiveEvent activeEvent : activeEvents) {
            int remaining = activeEvent.getRemainingSteps() - 1;
            if (remaining <= 0) {
                activeEventRepository.delete(activeEvent);
                log.info("EventService.decrementActiveEvents: Active event {} expired for participant {}",
                        activeEvent.getId(), roomParticipantId);
            } else {
                activeEvent.setRemainingSteps(remaining);
                activeEventRepository.save(activeEvent);
            }
        }
    }

    /**
     * Метод генерирует случайное событие для участника.
     * Если событие мгновенно теряет деньги (INSTANT_CASH) - возвращает Optional.
     * Если событие длительное - создается запись в active_events и возвращается Optional.
     * Если событие не произошло - возврат пустого Optional.
     *
     * @param roomId
     * @param roomParticipantId
     * @param eventProbability
     * @return Optional с мгновенным эффектом, если событие было типа INSTANT_CASH
     */
    public Optional<EventApplyResultDto> generateAndApplyEffect(UUID roomId,
                                                                UUID roomParticipantId,
                                                                BigDecimal eventProbability) {
        if (random.nextDouble() > eventProbability.doubleValue()) {
            return Optional.empty();
        }

        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> {
                    log.error("EventService.generateAndApplyEffect.Error: Room with id {} not found", roomId);
                    return new RoomNotFoundException("Room not found");
                });

        List<EventTemplate> templates = eventTemplateRepository.findByBusinessType(room.getBusinessType());
        if (templates.isEmpty()) {
            log.warn("No event templates found for business type {}", room.getBusinessType());
            return Optional.empty();
        }

        double totalWeight = templates.stream()
                .mapToDouble(template -> template.getProbabilityWeight().doubleValue())
                .sum();

        double r = random.nextDouble() * totalWeight;
        double accum = 0;
        EventTemplate selected = null;

        for (EventTemplate t : templates) {
            accum += t.getProbabilityWeight().doubleValue();
            if (r <= accum) {
                selected = t;
                break;
            }
        }
        if (selected == null) {
            return Optional.empty();
        }

        log.info("Event '{}' triggered for participant {}", selected.getName(), roomParticipantId);

        TriggeredEventDto triggeredEvent = TriggeredEventDto.builder()
                .name(selected.getName())
                .description(selected.getDescription())
                .effectType(selected.getEffectType().toString())
                .effectValue(selected.getEffectValue())
                .duration(selected.getDuration())
                .cashDelta(selected.getEffectType() == EffectType.INSTANT_CASH ? selected.getEffectValue() : null)
                .build();

        if (selected.getEffectType() == EffectType.INSTANT_CASH) {
            InstantEffectDto instantEffect = InstantEffectDto.builder()
                    .cashDelta(selected.getEffectValue())
                    .build();
            return Optional.of(EventApplyResultDto.builder()
                    .instantEffect(instantEffect)
                    .triggeredEvent(triggeredEvent)
                    .build());
        } else {
            BigDecimal staffMultiplier = BigDecimal.ONE;
            BigDecimal costMultiplier = BigDecimal.ONE;
            BigDecimal demandMultiplier = BigDecimal.ONE;
            switch (selected.getEffectType()) {
                case STAFF_MULTIPLIER -> staffMultiplier = selected.getEffectValue();
                case COST_MULTIPLIER -> costMultiplier = selected.getEffectValue();
                case DEMAND_MULTIPLIER -> demandMultiplier = selected.getEffectValue();
                default -> {
                }
            }
            ActiveEvent activeEvent = ActiveEvent.builder()
                    .roomParticipantId(roomParticipantId)
                    .eventTemplateId(selected.getId())
                    .remainingSteps(selected.getDuration())
                    .multiplierStaff(staffMultiplier)
                    .multiplierCost(costMultiplier)
                    .multiplierDemand(demandMultiplier)
                    .build();
            activeEventRepository.save(activeEvent);

            return Optional.of(EventApplyResultDto.builder()
                    .instantEffect(null)
                    .triggeredEvent(triggeredEvent)
                    .build());
        }
    }


}
