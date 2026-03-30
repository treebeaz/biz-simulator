package com.bizsimulator.service;

import com.bizsimulator.dto.room.RoomRequestDto;
import com.bizsimulator.dto.room.RoomResponseDto;
import com.bizsimulator.dto.room.RoomRulesDto;
import com.bizsimulator.entity.Room;
import com.bizsimulator.entity.RoomRules;
import com.bizsimulator.entity.User;
import com.bizsimulator.entity.enums.RoomStatus;
import com.bizsimulator.exception.RoomNotFoundException;
import com.bizsimulator.exception.RoomWithTeacherIdNotFoundException;
import com.bizsimulator.repository.RoomRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@RequiredArgsConstructor
@Service
@Slf4j
public class RoomService {

    private final UserService userService;
    private final RoomRepository roomRepository;

    @Transactional
    public RoomResponseDto createRoom(RoomRequestDto roomRequestDto,
                                      Authentication authentication) {
        if(roomRequestDto == null) {
            log.error("RoomService.CreateRoom.RoomRequestDto is null");
            throw new IllegalArgumentException("Request Dto is null");
        }

        User teacher = userService.getCurrentAuthenticationUser(authentication);

        Room room = Room.builder()
                .teacherId(teacher.getId())
                .groupId(roomRequestDto.getGroupId())
                .roomName(roomRequestDto.getRoomName())
                .businessType(roomRequestDto.getBusinessType())
                .roomStatus(RoomStatus.DRAFT)
                .initialBudget(roomRequestDto.getInitialBudget())
                .startDay(1)
                .endDay(30)
                .dayDurationSeconds(30)
                .build();

        RoomRules roomRules = RoomRules.builder().build();
        room.setRules(roomRules);

        Room savedRoom = roomRepository.save(room);
        log.info("RoomService.CreateRoom.Room created successfully");
        return toResponse(savedRoom);
    }

    private RoomResponseDto toResponse(Room room) {
        return RoomResponseDto.builder()
                .roomId(room.getId().toString())
                .teacherId(room.getTeacherId().toString())
                .groupId(room.getGroupId().toString())
                .roomName(room.getRoomName())
                .businessType(room.getBusinessType().toString())
                .roomStatus(room.getRoomStatus().toString())
                .initialBudget(room.getInitialBudget())
                .startDay(room.getStartDay())
                .endDay(room.getEndDay())
                .duration(room.getDayDurationSeconds())
                .roomRules(getRoomRules(room.getRules()))
                .build();
    }

    private RoomRulesDto getRoomRules(RoomRules roomRules) {
        return RoomRulesDto.builder()
                .rentPercent(roomRules.getRentPercent())
                .marketingRefPercent(roomRules.getMarketingRefPercent())
                .noiseMin(roomRules.getNoiseMin())
                .noiseMax(roomRules.getNoiseMax())
                .build();
    }

    public List<RoomResponseDto> getTeacherRooms(Authentication authentication) {
        User teacher = userService.getCurrentAuthenticationUser(authentication);

        return roomRepository.findAllByTeacherId(teacher.getId())
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public void deleteRoom(UUID roomId, Authentication authentication) {
        User teacher = userService.getCurrentAuthenticationUser(authentication);

        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> {
                    log.error("RoomService.DeleteRoom.Room not found with id");
                    return new RoomNotFoundException("Room not found");
                });
        if(room.getTeacherId() == null || !room.getTeacherId().equals(teacher.getId())) {
            log.error("RoomService.DeleteRoom.Room not found with teacher id");
            throw new RoomWithTeacherIdNotFoundException("Room with this teacher id does not exist");
        }
        roomRepository.delete(room);
        log.info("RoomService.DeleteRoom.Room deleted successfully");
    }
}