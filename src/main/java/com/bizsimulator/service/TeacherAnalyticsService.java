package com.bizsimulator.service;

import com.bizsimulator.dto.room.RoomParticipantStudentDto;
import com.bizsimulator.dto.simulation.TurnHistoryEntryDto;
import com.bizsimulator.entity.room.Room;
import com.bizsimulator.entity.room.RoomParticipant;
import com.bizsimulator.entity.user.User;
import com.bizsimulator.entity.user.UserProfile;
import com.bizsimulator.exception.UserNotFoundException;
import com.bizsimulator.exception.room.RoomNotFoundException;
import com.bizsimulator.exception.room.RoomWithTeacherIdDoesNotExistsException;
import com.bizsimulator.exception.simulation.RoomParticipantNotFoundException;
import com.bizsimulator.repository.room.RoomParticipantRepository;
import com.bizsimulator.repository.room.RoomRepository;
import com.bizsimulator.repository.simulation.TurnHistoryRepository;
import com.bizsimulator.repository.user.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@Slf4j
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class TeacherAnalyticsService {

    private final RoomRepository roomRepository;
    private final RoomParticipantRepository roomParticipantRepository;
    private final UserRepository userRepository;
    private final TurnHistoryRepository turnHistoryRepository;

    private final UserService userService;

    public List<RoomParticipantStudentDto> getRoomParticipant(UUID roomId,
                                                              Authentication authentication) {
        User teacher = userService.getCurrentAuthenticationUser(authentication);
        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> {
                    log.error("TeacherAnalyticsService.getRoomParticipant.Error: Room {} not found", roomId);
                    return new RoomNotFoundException("Room not found");
                });

        if (!room.getTeacherId().equals(teacher.getId())) {
            log.error("TeacherAnalyticsService.getRoomParticipant.Error: Room by teacher {} does not exists", teacher.getId());
            throw new RoomWithTeacherIdDoesNotExistsException("Room does not exists");
        }

        List<RoomParticipant> participants = roomParticipantRepository.findAllByRoomId(roomId);

        return participants.stream().map(participant -> {
            User student = userRepository.findById(participant.getUserId())
                    .orElseThrow(() -> {
                        log.error("TeacherAnalyticsService.getRoomParticipant.Error: User {} not found", participant.getUserId());
                        return new UserNotFoundException("User not found");
                    });

            UserProfile profile = student.getUserProfile();
            String fullName = profile.getFirstName() + " " + profile.getLastName();

            return RoomParticipantStudentDto.builder()
                    .studentId(student.getId())
                    .username(student.getUsername())
                    .email(student.getEmail())
                    .fullName(fullName)
                    .currentStep(participant.getCurrentStep())
                    .build();
        }).toList();
    }

    public List<TurnHistoryEntryDto> getStudentTurnHistory(UUID roomId,
                                                           UUID studentId,
                                                           Authentication authentication) {
        User teacher = userService.getCurrentAuthenticationUser(authentication);
        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> {
                    log.error("TeacherAnalyticsService.getStudentTurnHistory.Error: Room {} not found", roomId);
                    return new RoomNotFoundException("Room not found");
                });
        if (!room.getTeacherId().equals(teacher.getId())) {
            log.error("TeacherAnalyticsService.getStudentTurnHistory.Error: Room by teacher {} does not exists", teacher.getId());
            throw new RoomWithTeacherIdDoesNotExistsException("Room does not exists");
        }

        RoomParticipant participant = roomParticipantRepository.findByRoomIdAndUserId(roomId, studentId)
                .orElseThrow(() -> {
                    log.error("TeacherAnalyticsService.getStudentTurnHistory.Error: Room participant by room {} and user {} not found", roomId, studentId);
                    return new RoomParticipantNotFoundException("Room participant not found");
                });

        return turnHistoryRepository.findByRoomParticipantIdOrderByStepAsc(participant.getId()).stream()
                .map(turnHistory -> TurnHistoryEntryDto.builder()
                        .id(turnHistory.getId())
                        .roomParticipantId(turnHistory.getRoomParticipantId())
                        .step(turnHistory.getStep())
                        .price(turnHistory.getPrice())
                        .purchaseQuantity(turnHistory.getPurchaseQuantity())
                        .marketingExpense(turnHistory.getMarketingExpense())
                        .staffChange(turnHistory.getStaffChange())
                        .demand(turnHistory.getDemand())
                        .sales(turnHistory.getSales())
                        .revenue(turnHistory.getRevenue())
                        .salaryCost(turnHistory.getSalaryCost())
                        .variableCost(turnHistory.getVariableCost())
                        .purchaseCost(turnHistory.getPurchaseCost())
                        .totalCost(turnHistory.getTotalCost())
                        .profit(turnHistory.getProfit())
                        .cashAfter(turnHistory.getCashAfter())
                        .stockAfter(turnHistory.getStockAfter())
                        .currentCostAfter(turnHistory.getCurrentCostAfter())
                        .lastMarketingAfter(turnHistory.getLastMarketingAfter())
                        .build())
                .toList();

    }
}
