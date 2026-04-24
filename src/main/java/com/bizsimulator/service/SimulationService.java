package com.bizsimulator.service;

import com.bizsimulator.dto.sim.RoomRuntimeResponseDto;
import com.bizsimulator.dto.sim.StudentDecisionRequestDto;
import com.bizsimulator.dto.sim.StudentStateResponseDto;
import com.bizsimulator.entity.Room;
import com.bizsimulator.entity.RoomRules;
import com.bizsimulator.entity.RoomStudent;
import com.bizsimulator.entity.User;
import com.bizsimulator.entity.enums.RoomStatus;
import com.bizsimulator.entity.sim.*;
import com.bizsimulator.exception.RoomAccessDeniedException;
import com.bizsimulator.exception.RoomNotFoundException;
import com.bizsimulator.repository.RoomRepository;
import com.bizsimulator.repository.RoomRulesRepository;
import com.bizsimulator.repository.RoomStudentRepository;
import com.bizsimulator.repository.sim.RoomRuntimeRepository;
import com.bizsimulator.repository.sim.RoomStudentDayResultRepository;
import com.bizsimulator.repository.sim.RoomStudentDecisionRepository;
import com.bizsimulator.repository.sim.RoomStudentStateRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.BigInteger;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class SimulationService {

    private static final int BASE_DEMAND = 55;
    private static final BigDecimal REF_PRICE = new BigDecimal("250.00");
    private static final BigDecimal ELASTICITY = new BigDecimal("1.20");
    private static final BigDecimal UNIT_PURCHASE_COST = new BigDecimal("120.00");
    private static final BigDecimal MIN_PRICE = new BigDecimal("50.00");
    private static final BigDecimal DAYS_IN_MONTH = new BigDecimal("30");

    private final UserService userService;
    private final RoomRepository roomRepository;
    private final RoomRuntimeRepository roomRuntimeRepository;
    private final RoomRulesRepository roomRulesRepository;
    private final RoomStudentRepository roomStudentRepository;
    private final RoomStudentStateRepository roomStudentStateRepository;
    private final RoomStudentDecisionRepository roomStudentDecisionRepository;
    private final RoomStudentDayResultRepository roomStudentDayResultRepository;

    private final Random random = new Random();

    private final RoomService roomService;

    @Transactional
    public RoomRuntimeResponseDto startRoom(UUID roomId, Authentication authentication) {
        Room room = getRoomByCurrentTeacher(roomId, authentication);
        RoomRuntime roomRuntime = roomRuntimeRepository.findById(room.getId())
                .orElseGet(() -> getRoomRuntimeBuilderWithDefaultValue(room));

        if (roomRuntime.getFinishedAt() != null) {
            roomRuntime.setFinishedAt(null);
            roomRuntime.setCurrentDay(room.getStartDay());
        }

        if (roomRuntime.getStartedAt() == null) {
            bootstrapStudentState(room);
            roomRuntime.setStartedAt(LocalDateTime.now());
        }

        roomRuntime.setIsRunning(Boolean.TRUE);
        roomRuntime.setLastTickAt(LocalDateTime.now());
        room.setRoomStatus(RoomStatus.RUNNING);

        roomRuntimeRepository.save(roomRuntime);
        roomRepository.save(room);

        return toRuntimeDto(roomRuntime);
    }

    @Transactional
    public RoomRuntimeResponseDto pauseRoom(UUID roomId, Authentication authentication) {
        RoomRuntime roomRuntime = getRoomRuntimeByCurrentTeacher(roomId, authentication);
        roomRuntime.setIsRunning(Boolean.FALSE);
        roomRuntimeRepository.save(roomRuntime);
        return toRuntimeDto(roomRuntime);
    }

    @Transactional
    public RoomRuntimeResponseDto resumeRoom(UUID roomId, Authentication authentication) {
        RoomRuntime roomRuntime = getRoomRuntimeByCurrentTeacher(roomId, authentication);
        roomRuntime.setIsRunning(Boolean.TRUE);
        roomRuntime.setLastTickAt(LocalDateTime.now());
        roomRuntimeRepository.save(roomRuntime);

        return toRuntimeDto(roomRuntime);
    }

    @Transactional
    public RoomRuntimeResponseDto setSpeed(UUID roomId, Integer speed, Authentication authentication) {
        if (speed == null || (speed != 1 && speed != 2 && speed != 4)) {
            log.error("SimulationService.setSpeed.Error: Invalid speed={}", speed);
            throw new IllegalArgumentException("Invalid speed. Allowed: 1, 2, 4");
        }

        RoomRuntime roomRuntime = getRoomRuntimeByCurrentTeacher(roomId, authentication);
        roomRuntime.setSpeedMultiplier(speed);
        roomRuntimeRepository.save(roomRuntime);

        return toRuntimeDto(roomRuntime);
    }

    @Transactional
    public void submitDecision(StudentDecisionRequestDto dto, Authentication authentication) {
        User student = userService.getCurrentAuthenticationUser(authentication);
        UUID roomId = dto.getRoomId();

        RoomRuntime runtime = roomRuntimeRepository.findById(roomId)
                .orElseThrow(() -> {
                    log.error("SimulationService.submitDecision.Error: RoomRuntime not found for roomId={}", roomId);
                    return new RoomNotFoundException("Room runtime not found");
                });

        RoomStudentDecision decision = roomStudentDecisionRepository
                .findByRoomIdAndStudentIdAndDayNo(roomId,
                        student.getId(),
                        runtime.getCurrentDay())
                .orElse(RoomStudentDecision.builder()
                        .roomId(roomId)
                        .studentId(student.getId())
                        .dayNo(runtime.getCurrentDay())
                        .build());

        decision.setPrice(dto.getPrice());
        decision.setPurchaseUnits(dto.getPurchaseUnits());
        decision.setMarketingBudget(dto.getMarketingBudget());
        decision.setHireJunior(dto.getHireJunior());
        decision.setFireJunior(dto.getFireJunior());
        decision.setHireExperienced(dto.getHireExperienced());
        decision.setFireExperienced(dto.getFireExperienced());

        roomStudentDecisionRepository.save(decision);
    }

    public StudentStateResponseDto getStudentState(UUID roomId, Authentication authentication) {
        User student = userService.getCurrentAuthenticationUser(authentication);
        requireStudentInRoom(roomId, authentication);

        RoomStudentState state = roomStudentStateRepository
                .findByRoomIdAndStudentId(roomId, student.getId())
                .orElse(null);

        if (state == null) {
            Room room = findRoomById(roomId, "SimulationService.getStudentState.Error: Room with id {} not found");
            bootstrapStudentState(room);
            state = roomStudentStateRepository
                    .findByRoomIdAndStudentId(roomId, student.getId())
                    .orElseThrow(() -> new RoomNotFoundException("Room with id not found"));
        }

        return toStudentStateDto(state);
    }

    @Scheduled(fixedDelay = 1000)
    @Transactional
    public void tickScheduler() {
        List<RoomRuntime> active = roomRuntimeRepository.findAllByIsRunningTrue();
        LocalDateTime now = LocalDateTime.now();

        active.forEach(activeRuntime -> {
            Room room = roomRepository.findById(activeRuntime.getRoomId()).orElse(null);
            if (room == null || !Objects.equals(room.getRoomStatus(), RoomStatus.RUNNING)) {
                return;
            }

            int secPerDay = Math.max(1, room.getDayDurationSeconds() / activeRuntime.getSpeedMultiplier());
            if (activeRuntime.getLastTickAt() == null
                    || !activeRuntime.getLastTickAt().plusSeconds(secPerDay).isAfter(now)) {
                processOneDay(room, activeRuntime);
                activeRuntime.setLastTickAt(now);

                if (activeRuntime.getCurrentDay() > room.getEndDay()) {
                    activeRuntime.setIsRunning(Boolean.FALSE);
                    activeRuntime.setFinishedAt(now);
                    room.setRoomStatus(RoomStatus.FINISHED);
                    roomRepository.save(room);
                }

                roomRuntimeRepository.save(activeRuntime);
            }
        });
    }

    private void processOneDay(Room room, RoomRuntime activeRuntime) {
        RoomRules rules = roomRulesRepository.findById(room.getId())
                .orElseThrow(() -> {
                    log.error("SimulationService.processOneDay.Error: RoomRules not found for roomId={}", room.getId());
                    return new RoomNotFoundException("Room rules not found");
                });
        int day = activeRuntime.getCurrentDay();
        List<RoomStudentState> states = roomStudentStateRepository.findAllByRoomId(room.getId());

        states.forEach(state -> {
            if (Boolean.TRUE.equals(state.getIsBankrupt())) {
                return;
            }

            RoomStudentDecision decision = roomStudentDecisionRepository
                    .findByRoomIdAndStudentIdAndDayNo(room.getId(), state.getStudentId(), day)
                    .orElse(RoomStudentDecision.builder()
                            .roomId(room.getId())
                            .studentId(state.getStudentId())
                            .dayNo(day)
                            .purchaseUnits(0)
                            .marketingBudget(BigDecimal.ZERO)
                            .hireJunior(0)
                            .fireJunior(0)
                            .hireExperienced(0)
                            .fireExperienced(0)
                            .build());

            applyDecision(state, decision, rules);

            BigDecimal marketingRef = room.getInitialBudget().multiply(rules.getMarketingRefPercent());

            BigDecimal marketingNorm = BigDecimal.ZERO;
            if (marketingRef.compareTo(BigDecimal.ZERO) > 0) {
                marketingNorm = state.getMarketingBudget().divide(marketingRef, 6, RoundingMode.HALF_UP);
                if (marketingNorm.compareTo(BigDecimal.ONE) > 0) {
                    marketingNorm = BigDecimal.ONE;
                }
                if (marketingNorm.compareTo(BigDecimal.ZERO) < 0) {
                    marketingNorm = BigDecimal.ZERO;
                }
            }
            BigDecimal epsilon = buildNoise(rules);
            BigDecimal ratio = REF_PRICE.divide(state.getPrice(), 10, RoundingMode.HALF_UP);
            BigDecimal priceFactor = powDecimal(ratio, ELASTICITY);

            BigDecimal demand = BigDecimal.valueOf(BASE_DEMAND)
                    .multiply(priceFactor)
                    .multiply(BigDecimal.ONE.add(marketingNorm))
                    .multiply(epsilon);
            int capacity = rules.getCap0()
                           + state.getExperiencedCount() * rules.getExperiencedCapacity()
                           + state.getJuniorCount() * rules.getJuniorCapacity();
            int demandUnits = Math.max(0, demand.setScale(0, RoundingMode.HALF_UP).intValue());
            int soldUnits = Math.min(Math.min(demandUnits, state.getStockUnits()), capacity);
            BigDecimal revenue = state.getPrice().multiply(BigDecimal.valueOf(soldUnits));

            int requestedPurchaseUnits = safeNonNegative(decision.getPurchaseUnits());

            BigDecimal rentDaily = room.getInitialBudget()
                    .multiply(rules.getRentPercent())
                    .divide(DAYS_IN_MONTH, 2, RoundingMode.HALF_UP);

            BigDecimal salariesDaily = rules.getJuniorSalaryMonth()
                    .multiply(BigDecimal.valueOf(state.getJuniorCount()))
                    .add(rules.getExperiencedSalaryMonth()
                            .multiply(BigDecimal.valueOf(state.getExperiencedCount())))
                    .divide(DAYS_IN_MONTH, 2, RoundingMode.HALF_UP);

            BigDecimal unavoidable = state.getMarketingBudget().add(rentDaily).add(salariesDaily);
            BigDecimal availableForPurchase = state.getCash().subtract(unavoidable);
            int affordablePurchaseUnits = 0;
            if(availableForPurchase.compareTo(BigDecimal.ZERO) > 0) {
                affordablePurchaseUnits = availableForPurchase
                        .divide(UNIT_PURCHASE_COST, 0, RoundingMode.FLOOR)
                        .intValue();
            }

            int purchaseUnits = Math.min(requestedPurchaseUnits, Math.max(0, affordablePurchaseUnits));

            BigDecimal cogs = BigDecimal.valueOf(purchaseUnits).multiply(UNIT_PURCHASE_COST);

            BigDecimal expenses = cogs
                    .add(state.getMarketingBudget())
                    .add(rentDaily)
                    .add(salariesDaily);
            BigDecimal dayProfit = revenue.subtract(expenses);
            state.setCash(state.getCash().add(dayProfit));
            state.setCumulativeProfit(state.getCumulativeProfit().add(dayProfit));
            state.setStockUnits(Math.max(0, state.getStockUnits() - soldUnits + purchaseUnits));
            if (state.getCash().compareTo(BigDecimal.ZERO) < 0) {
                state.setIsBankrupt(true);
            }
            roomStudentStateRepository.save(state);

            RoomStudentDayResult result = roomStudentDayResultRepository
                    .findByRoomIdAndStudentIdAndDayNo(room.getId(), state.getStudentId(), day)
                    .orElseGet(() -> RoomStudentDayResult.builder()
                            .roomId(room.getId())
                            .studentId(state.getStudentId())
                            .dayNo(day)
                            .build()
                    );

            result.setDemandUnits(demandUnits);
            result.setSoldUnits(soldUnits);
            result.setRevenue(revenue.setScale(2, RoundingMode.HALF_UP));
            result.setExpenses(expenses.setScale(2, RoundingMode.HALF_UP));
            result.setDayProfit(dayProfit.setScale(2, RoundingMode.HALF_UP));
            result.setEndCash(state.getCash().setScale(2, RoundingMode.HALF_UP));
            result.setEndStockUnits(state.getStockUnits());
            roomStudentDayResultRepository.save(result);

        });

        activeRuntime.setCurrentDay(day+1);
    }

    private BigDecimal buildNoise(RoomRules rules) {
        double min = rules.getNoiseMin().doubleValue();
        double max = rules.getNoiseMax().doubleValue();
        return BigDecimal.valueOf(min + (max - min) * random.nextDouble());
    }

    private BigDecimal powDecimal(BigDecimal base, BigDecimal exponent) {
        double b = base.doubleValue();
        if (!(b > 0.0)) {
            return BigDecimal.ZERO;
        }
        double e = exponent.doubleValue();
        double v = Math.pow(b, e);
        if (!Double.isFinite(v)) {
            return BigDecimal.ZERO;
        }
        return BigDecimal.valueOf(v);
    }

    private int safeNonNegative(Integer value) {
        return value == null ? 0 : Math.max(0, value);
    }

    private void applyDecision(RoomStudentState state, RoomStudentDecision decision, RoomRules rules) {
        if (decision.getPrice() != null && decision.getPrice().compareTo(new BigDecimal("50")) >= 0) {
            state.setPrice(decision.getPrice());
        }
        if (decision.getMarketingBudget() != null && decision.getMarketingBudget().compareTo(new BigDecimal(BigInteger.ZERO)) >= 0) {
            state.setMarketingBudget(decision.getMarketingBudget());
        }

        int purchase = safeNonNegative(decision.getPurchaseUnits());
        int hj = safeNonNegative(decision.getHireJunior());
        int fj = safeNonNegative(decision.getFireJunior());
        int he = safeNonNegative(decision.getHireExperienced());
        int fe = safeNonNegative(decision.getFireExperienced());

        int afterJunior = Math.max(0, state.getJuniorCount() + hj - fj);
        int afterExperienced = Math.max(0, state.getExperiencedCount() + he - fe);

        int slots = rules.getStaffSlots() == null ? 0 : Math.max(0, rules.getStaffSlots());
        int total = afterJunior + afterExperienced;

        if(slots > 0 && total > slots) {
            int keepExperienced = Math.min(afterExperienced, slots);
            int remaining = slots - keepExperienced;
            int keepJunior = Math.min(afterJunior, remaining);
            afterExperienced = keepExperienced;
            afterJunior = keepJunior;
        }

        state.setJuniorCount(afterJunior);
        state.setExperiencedCount(afterExperienced);
        decision.setPurchaseUnits(purchase);
    }

    private StudentStateResponseDto toStudentStateDto(RoomStudentState state) {
        return StudentStateResponseDto.builder()
                .studentId(state.getStudentId().toString())
                .price(state.getPrice())
                .marketingBudget(state.getMarketingBudget())
                .experiencedCount(state.getExperiencedCount())
                .juniorCount(state.getJuniorCount())
                .stockUnits(state.getStockUnits())
                .cash(state.getCash())
                .bankrupt(state.getIsBankrupt())
                .cumulativeProfit(state.getCumulativeProfit())
                .build();
    }

    private RoomRuntimeResponseDto toRuntimeDto(RoomRuntime roomRuntime) {
        return RoomRuntimeResponseDto.builder()
                .roomId(roomRuntime.getRoomId().toString())
                .currentDay(roomRuntime.getCurrentDay())
                .running(roomRuntime.getIsRunning())
                .speedMultiplayer(roomRuntime.getSpeedMultiplier())
                .startedAt(roomRuntime.getStartedAt() == null ? null : roomRuntime.getStartedAt().toString())
                .finishedAt(roomRuntime.getFinishedAt() == null ? null : roomRuntime.getFinishedAt().toString())
                .build();
    }

    private void bootstrapStudentState(Room room) {
        List<RoomStudent> participants = roomStudentRepository.findAllByRoomId(room.getId());
        participants.forEach(student -> {
            boolean exists = roomStudentStateRepository.findByRoomIdAndStudentId(room.getId(), student.getStudentId())
                    .isPresent();

            if (exists) {
                return;
            }

            RoomStudentState state = RoomStudentState.builder()
                    .roomId(room.getId())
                    .studentId(student.getStudentId())
                    .cash(room.getInitialBudget())
                    .stockUnits(40)
                    .price(new BigDecimal("250.00"))
                    .marketingBudget(BigDecimal.ZERO)
                    .juniorCount(0)
                    .experiencedCount(0)
                    .cumulativeProfit(BigDecimal.ZERO)
                    .isBankrupt(false)
                    .build();

            roomStudentStateRepository.save(state);
        });
    }

    private Room getRoomByCurrentTeacher(UUID roomId, Authentication authentication) {
        User teacher = userService.getCurrentAuthenticationUser(authentication);
        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> {
                    log.error("SimulationService.getRoomByCurrentTeacher.Error: Room with id {} not found", roomId);
                    return new RoomNotFoundException("Room not found");
                });
        if (!Objects.equals(room.getTeacherId(), teacher.getId())) {
            log.error("SimulationService.getRoomByCurrentTeacher.Error: teacher mismatch, roomId={}", roomId);
            throw new RoomNotFoundException("Current teacher is not the same teacher");
        }

        return room;
    }

    private RoomRuntime getRoomRuntimeByCurrentTeacher(UUID roomId, Authentication authentication) {
        Room room = getRoomByCurrentTeacher(roomId, authentication);
        return roomRuntimeRepository.findById(room.getId())
                .orElseThrow(() -> {
                    log.error("SimulationService.getRoomRuntimeByCurrentTeacher.Error: RoomRuntime with id {} not found", roomId);
                    return new RoomNotFoundException("Room runtime not found");
                });
    }

    public RoomSimResponseDto getMyRooms(Authentication authentication) {
        User student = userService.getCurrentAuthenticationUser(authentication);

        RoomStudent membership = roomStudentRepository.findFirstByStudentId(student.getId())
                .orElseThrow(() -> {
                    log.error("RoomService.getMyRooms.Error: Student with id {} not found", student.getId());
                    return new RoomNotFoundException("Student is not assigned to any room");
                });

        Room room = roomRepository.findById(membership.getRoomId())
                .orElseThrow(() -> {
                    log.error("RoomService.getMyRooms.Error: Room with id {} not found", membership.getRoomId());
                    return new RoomNotFoundException("Room not found");
                });

        return buildRoomSimResponseDto(room);
    }

    private RoomSimResponseDto buildRoomSimResponseDto(Room room) {
        return RoomSimResponseDto.builder()
                .roomId(room.getId().toString())
                .roomName(room.getRoomName())
                .dayDurationSeconds(room.getDayDurationSeconds())
                .endDay(room.getEndDay())
                .build();
    }

    public RoomRuntimeResponseDto getRuntimeForStudent(UUID roomId, Authentication authentication) {
        requireStudentInRoom(roomId, authentication);

        Room room = findRoomById(roomId, "RoomService.getRuntimeForStudent.Error: Room with id {} not found");

        RoomRuntime runtime = roomRuntimeRepository.findById(room.getId())
                .orElseGet(() -> getRoomRuntimeBuilderWithDefaultValue(room));

        return RoomRuntimeResponseDto.builder()
                .roomId(runtime.getRoomId().toString())
                .currentDay(runtime.getCurrentDay())
                .running(runtime.getIsRunning())
                .speedMultiplayer(runtime.getSpeedMultiplier())
                .startedAt(runtime.getStartedAt() == null ? null : runtime.getStartedAt().toString())
                .finishedAt(runtime.getFinishedAt() == null ? null : runtime.getFinishedAt().toString())
                .dayDurationSeconds(room.getDayDurationSeconds())
                .lastTickAt(runtime.getLastTickAt() == null ? null : runtime.getLastTickAt().toString())
                .build();
    }

    private void requireStudentInRoom(UUID roomId, Authentication authentication) {
        User student = userService.getCurrentAuthenticationUser(authentication);
        boolean inRoom = roomStudentRepository.existsByRoomIdAndStudentId(roomId, student.getId());
        if (!inRoom) {
            log.error("RoomService.getRuntimeForStudent.Error: Student with id {} don't exists in room {} ", student.getId(), roomId);
            throw new RoomAccessDeniedException("Student has no access to this room");
        }
    }

    @Transactional
    public RoomRuntimeResponseDto startRoomByStudent(UUID roomId, Authentication authentication) {
        requireStudentInRoom(roomId, authentication);

        Room room = findRoomById(roomId, "RoomService.startRoomByStudent.Error: Room with id {} not found");

        RoomRuntime runtime = roomRuntimeRepository.findById(room.getId())
                .orElseGet(() -> getRoomRuntimeBuilderWithDefaultValue(room));

        if (runtime.getFinishedAt() != null) {
            runtime.setFinishedAt(null);
            runtime.setCurrentDay(room.getStartDay());
        }

        if (runtime.getStartedAt() == null) {
            bootstrapStudentState(room);
            runtime.setStartedAt(LocalDateTime.now());
        }

        runtime.setIsRunning(true);
        runtime.setLastTickAt(LocalDateTime.now());
        room.setRoomStatus(RoomStatus.RUNNING);

        roomRuntimeRepository.save(runtime);
        roomRepository.save(room);

        return toRuntimeDto(runtime);
    }

    @Transactional
    public RoomRuntimeResponseDto pauseRoomByStudent(UUID roomId, Authentication authentication) {
        requireStudentInRoom(roomId, authentication);
        RoomRuntime runtime = roomRuntimeRepository.findById(roomId)
                .orElseThrow(() -> new RoomNotFoundException("Runtime not found"));
        runtime.setIsRunning(false);
        roomRuntimeRepository.save(runtime);
        return toRuntimeDto(runtime);
    }

    @Transactional
    public RoomRuntimeResponseDto resumeRoomByStudent(UUID roomId, Authentication authentication) {
        requireStudentInRoom(roomId, authentication);
        RoomRuntime runtime = roomRuntimeRepository.findById(roomId)
                .orElseThrow(() -> new RoomNotFoundException("Runtime not found"));
        runtime.setIsRunning(true);
        runtime.setLastTickAt(LocalDateTime.now());
        roomRuntimeRepository.save(runtime);
        return toRuntimeDto(runtime);
    }

    @Transactional
    public RoomRuntimeResponseDto setSpeedByStudent(UUID roomId, Integer speed, Authentication authentication) {
        requireStudentInRoom(roomId, authentication);
        if (speed == null || (speed != 1 && speed != 2 && speed != 4)) {
            throw new IllegalArgumentException("Invalid speed");
        }
        RoomRuntime runtime = roomRuntimeRepository.findById(roomId)
                .orElseThrow(() -> new RoomNotFoundException("Runtime not found"));
        runtime.setSpeedMultiplier(speed);
        roomRuntimeRepository.save(runtime);
        return toRuntimeDto(runtime);
    }

    @Transactional
    public RoomRuntimeResponseDto finishRoomByStudent(UUID roomId, Authentication authentication) {
        requireStudentInRoom(roomId, authentication);
        Room room = roomRepository.findById(roomId).orElseThrow(() -> new RoomNotFoundException("Room not found"));
        RoomRuntime runtime = roomRuntimeRepository.findById(roomId)
                .orElseThrow(() -> new RoomNotFoundException("Runtime not found"));
        runtime.setIsRunning(false);
        runtime.setFinishedAt(LocalDateTime.now());
        room.setRoomStatus(RoomStatus.FINISHED);
        roomRuntimeRepository.save(runtime);
        roomRepository.save(room);
        return toRuntimeDto(runtime);
    }

    private RoomRuntime getRoomRuntimeBuilderWithDefaultValue(Room room) {
        return RoomRuntime.builder()
                .roomId(room.getId())
                .currentDay(room.getStartDay())
                .isRunning(false)
                .speedMultiplier(1)
                .build();
    }

    private Room findRoomById(UUID roomId, String message) {
        return roomRepository.findById(roomId)
                .orElseThrow(() -> {
                    log.error(message, roomId);
                    return new RoomNotFoundException("Room not found");
                });
    }

    @Transactional
    public RoomRuntimeResponseDto restartRoomByStudent(UUID roomId, Authentication authentication) {
        requireStudentInRoom(roomId, authentication);

        Room room = findRoomById(roomId, "SimulationService.respawnRoomByStudent.Error: Room with id {} not found");

        roomStudentDayResultRepository.deleteAllByRoomId(roomId);
        roomStudentDecisionRepository.deleteAllByRoomId(roomId);
        roomStudentStateRepository.deleteAllByRoomId(roomId);

        RoomRuntime runtime = roomRuntimeRepository.findById(roomId)
                .orElseGet(() -> getRoomRuntimeBuilderWithDefaultValue(room));

        runtime.setCurrentDay(room.getStartDay());
        runtime.setIsRunning(false);
        runtime.setSpeedMultiplier(1);
        runtime.setLastTickAt(null);
        runtime.setStartedAt(null);
        runtime.setFinishedAt(null);

        room.setRoomStatus(RoomStatus.DRAFT);
        roomRuntimeRepository.save(runtime);
        roomRepository.save(room);
        bootstrapStudentState(room);

        return getRuntimeForStudent(roomId, authentication);
    }

    public RoomSimMetaDto getMetaData(UUID roomId,Authentication authentication) {
        RoomRules roomRules = roomRulesRepository.findById(roomId)
                .orElseThrow(() -> new  RoomNotFoundException("Room not found"));

        return RoomSimMetaDto.builder()
                .minPrice(MIN_PRICE)
                .unitPurchaseCost(UNIT_PURCHASE_COST)
                .refPrice(REF_PRICE)
                .elasticity(ELASTICITY)
                .baseDemand(BASE_DEMAND)
                .rules(roomService.getRoomRules(roomRules))
                .build();
    }
}
