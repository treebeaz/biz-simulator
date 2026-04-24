package com.bizsimulator.service;

import com.bizsimulator.dto.room.*;
import com.bizsimulator.dto.sim.RoomRuntimeResponseDto;
import com.bizsimulator.entity.*;
import com.bizsimulator.entity.enums.Role;
import com.bizsimulator.entity.enums.RoomStatus;
import com.bizsimulator.entity.enums.RoomStudentStatus;
import com.bizsimulator.entity.sim.RoomRuntime;
import com.bizsimulator.entity.sim.RoomSimResponseDto;
import com.bizsimulator.exception.*;
import com.bizsimulator.repository.RoomRepository;
import com.bizsimulator.repository.RoomStudentRepository;
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
    private final RoomStudentRepository roomStudentRepository;

    @Transactional
    public RoomResponseDto createRoom(RoomRequestDto roomRequestDto,
                                      Authentication authentication) {
        if (roomRequestDto == null) {
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

    protected RoomRulesDto getRoomRules(RoomRules roomRules) {
        return RoomRulesDto.builder()
                .rentPercent(roomRules.getRentPercent())
                .marketingRefPercent(roomRules.getMarketingRefPercent())
                .noiseMin(roomRules.getNoiseMin())
                .noiseMax(roomRules.getNoiseMax())
                .cap0(roomRules.getCap0())
                .staffSlots(roomRules.getStaffSlots())
                .experiencedCapacity(roomRules.getExperiencedCapacity())
                .juniorCapacity(roomRules.getJuniorCapacity())
                .experiencedSalaryMonth(roomRules.getExperiencedSalaryMonth())
                .juniorSalaryMonth(roomRules.getJuniorSalaryMonth())
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
        if (room.getTeacherId() == null || !room.getTeacherId().equals(teacher.getId())) {
            log.error("RoomService.DeleteRoom.Room not found with teacher id");
            throw new RoomWithTeacherIdNotFoundException("Room with this teacher id does not exist");
        }
        roomRepository.delete(room);
        log.info("RoomService.DeleteRoom.Room deleted successfully");
    }

    public List<RoomStudentDto> getRoomStudents(UUID roomId,
                                                Authentication authentication) {
        Room room = getRoomById(roomId, authentication);

        return roomStudentRepository.findAllByRoomId(room.getId())
                .stream()
                .map(this::toRoomStudentDto)
                .toList();
    }

    private Room getRoomById(UUID roomId, Authentication authentication) {
        User teacher = userService.getCurrentAuthenticationUser(authentication);
        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> {
                    log.error("RoomService.getRoomById.Error: Room with id {} not found", roomId);
                    return new RoomNotFoundException("Room not found");
                });
        if (!room.getTeacherId().equals(teacher.getId())) {
            log.error("RoomService.getRoomById.Error: Room with teacher id {} does not exist`", teacher.getId());
            throw new RoomAccessDeniedException("You have no access to this room");
        }
        log.info("RoomService.getRoomById.Success: Rooms found successfully");
        return room;
    }

    private RoomStudentDto toRoomStudentDto(RoomStudent roomStudent) {
        User student = userService.findById(roomStudent.getStudentId())
                .orElseThrow(() -> {
                    log.error("RoomService.toRoomStudentDto.Error: Student with id {} not found", roomStudent.getStudentId());
                    return new UserNotFoundException("Student not found");
                });
        UserProfile userProfile = student.getUserProfile();
        String fullName = userProfile.getFirstName() + " " + userProfile.getLastName();

        log.info("RoomService.toRoomStudentDto.Success: Build RoomStudentDto successfully");
        return RoomStudentDto.builder()
                .studentId(roomStudent.getStudentId().toString())
                .username(student.getUsername())
                .fullName(fullName)
                .email(student.getEmail())
                .status(roomStudent.getStatus().name())
                .attemptNo(roomStudent.getAttemptNo())
                .joinedAt(roomStudent.getJoinedAt().toString())
                .build();
    }

    @Transactional
    public RoomStudentDto addStudentToRoom(UUID roomId,
                                           AddRoomStudentRequestDto request,
                                           Authentication authentication) {
        Room room = getRoomById(roomId, authentication);

        User student = userService.findById(request.getStudentId())
                .orElseThrow(() -> {
                    log.error("RoomService.addStudentToRoom.Error: User with id {} not found", request.getStudentId());
                    return new UserNotFoundException("User not found");
                });

        if (student.getRole() != Role.STUDENT) {
            log.error("RoomService.addStudentToRoom.Error: User with role {} is not a student", student.getRole().toString());
            throw new IllegalArgumentException("User is not a student");
        }

        if (roomStudentRepository.existsByRoomIdAndStudentId(room.getId(), student.getId())) {
            log.error("RoomService.addStudentToRoom.Error: Room with id {} already exists with student {}", room.getId(), student.getId());
            throw new RoomStudentAlreadyExistsException("Student already added to room");
        }

        RoomStudent roomStudent = RoomStudent.builder()
                .roomId(room.getId())
                .studentId(student.getId())
                .status(RoomStudentStatus.ACTIVE)
                .attemptNo(1)
                .build();

        roomStudentRepository.save(roomStudent);
        log.info("RoomService.addStudentToRoom.Success: Student was added to group successfully");
        return toRoomStudentDto(roomStudent);
    }

    @Transactional
    public void removeStudentFromRoom(UUID roomId,
                                      UUID studentId,
                                      Authentication authentication) {
        Room room = getRoomById(roomId, authentication);
        RoomStudent roomStudent = roomStudentRepository.findByRoomIdAndStudentId(room.getId(), studentId)
                .orElseThrow(() -> new RoomNotFoundException("Room student not found"));

        roomStudentRepository.delete(roomStudent);
    }
}