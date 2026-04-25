package com.bizsimulator.service;

import com.bizsimulator.dto.room.CreateRoomRequest;
import com.bizsimulator.dto.room.JoinRoomByCodeRequest;
import com.bizsimulator.dto.room.RoomResponseDto;
import com.bizsimulator.entity.enums.Status;
import com.bizsimulator.entity.room.Room;
import com.bizsimulator.entity.room.RoomParticipant;
import com.bizsimulator.entity.user.User;
import com.bizsimulator.exception.room.RoomByJoinCodeNotFoundException;
import com.bizsimulator.exception.room.RoomNotFoundException;
import com.bizsimulator.exception.room.RoomWithTeacherIdDoesNotExistsException;
import com.bizsimulator.exception.room.StudentIsAlreadyInRoomException;
import com.bizsimulator.mapper.RoomMapper;
import com.bizsimulator.repository.room.RoomParticipantRepository;
import com.bizsimulator.repository.room.RoomRepository;
import com.bizsimulator.util.JoinCodeGenerator;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@Slf4j
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class RoomService {

    private static final Integer MAX_TURNS_CONST = 30;
    private static final Boolean IS_TEACHER_TRUE = Boolean.TRUE;
    private static final Boolean IS_TEACHER_FALSE = Boolean.FALSE;
    private static final Integer CURRENT_STEP_DEFAULT = 0;

    private final RoomRepository roomRepository;
    private final RoomParticipantRepository roomParticipantRepository;

    private final UserService userService;
    private final JoinCodeGenerator joinCodeGenerator;

    private final RoomMapper roomMapper;

    @Transactional
    @PreAuthorize("hasRole('TEACHER')")
    public RoomResponseDto createRoom(CreateRoomRequest request,
                                      Authentication authentication) {
        User teacher = userService.getCurrentAuthenticationUser(authentication);
        Room room = buildDefaultRoomEntity(request, teacher.getId());
        Room savedRoom = roomRepository.save(room);

        log.info("Room with id {} has been created", savedRoom.getId());
        return roomMapper.toRoomResponseDto(savedRoom, IS_TEACHER_TRUE);
    }

    private Room buildDefaultRoomEntity(CreateRoomRequest request,
                                        UUID teacherId) {
        return Room.builder()
                .teacherId(teacherId)
                .name(request.getName())
                .businessType(request.getBusinessType())
                .status(Status.DRAFT)
                .maxTurns(MAX_TURNS_CONST)
                .joinCode(joinCodeGenerator.generate())
                .build();
    }

    @Transactional
    @PreAuthorize("hasRole('STUDENT')")
    public RoomResponseDto joinRoomByCode(JoinRoomByCodeRequest request,
                                    Authentication authentication) {
        User student  = userService.getCurrentAuthenticationUser(authentication);
        Room room = roomRepository.findByJoinCode(request.getJoinCode())
                .orElseThrow(() -> {
                     log.error("RoomService.joinRoomByCode.Error: Room by code {} not found", request.getJoinCode());
                     return new RoomByJoinCodeNotFoundException("Room by join code not found");
                });
        boolean roomExists = roomParticipantRepository.existsByRoomIdAndUserId(room.getId(), student.getId());
        if(roomExists) {
            log.error("RoomService.joinRoomByCode.Error: Student with id {} is already joined to the room",
                    request.getJoinCode());
            throw new StudentIsAlreadyInRoomException("Student already joined the room");
        }

        RoomParticipant roomParticipant = buildRoomParticipantEntity(room.getId(), student.getId());
        roomParticipantRepository.save(roomParticipant);

        log.info("RoomService.joinRoomByCode.Success: Student joined to the room with id {}", room.getId());
        return roomMapper.toRoomResponseDto(room, IS_TEACHER_FALSE);
    }

    private RoomParticipant buildRoomParticipantEntity(UUID roomId,
                                                       UUID studentId) {
        return RoomParticipant.builder()
                .roomId(roomId)
                .userId(studentId)
                .currentStep(CURRENT_STEP_DEFAULT)
                .joinedAt(LocalDateTime.now())
                .build();
    }

    @PreAuthorize("hasRole('TEACHER')")
    public List<RoomResponseDto> getAllRoomByTeacher(Authentication authentication) {
        User teacher = userService.getCurrentAuthenticationUser(authentication);
        log.info("RoomService.getAllRoomByTeacher.Success: All rooms were successfully found");
        return roomRepository.findAllByTeacherId(teacher.getId())
                .stream()
                .map(r -> roomMapper.toRoomResponseDto(r, IS_TEACHER_TRUE))
                .collect(Collectors.toList());
    }

    @PreAuthorize("hasRole('TEACHER')")
    private Room getRoomById(UUID roomId, Authentication authentication) {
        User teacher =  userService.getCurrentAuthenticationUser(authentication);
        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> {
                    log.error("RoomService.getRoomById.Error: Room with id {} not found", roomId);
                    return new RoomNotFoundException("Room not found");
                });
        if(!room.getTeacherId().equals(teacher.getId())) {
            log.error("RoomService.getRoomById.Error: Room with teacher id {} does not exists", teacher.getId());
            throw new RoomWithTeacherIdDoesNotExistsException("Room does not exists");
        }

        log.info("RoomService.getRoomById.Success: Getting room with id {}", roomId);
        return room;
    }

    @Transactional
    @PreAuthorize("hasRole('TEACHER')")
    public void deleteRoom(UUID roomId, Authentication authentication) {
        Room room = getRoomById(roomId, authentication);
        roomRepository.delete(room);
        log.info("RoomService.deleteRoom.Success: Room with id {} has been deleted", room.getId());
    }
}
