package com.bizsimulator.controller.rest;

import com.bizsimulator.dto.room.CreateRoomRequest;
import com.bizsimulator.dto.room.JoinRoomByCodeRequest;
import com.bizsimulator.dto.room.RoomParticipantStudentDto;
import com.bizsimulator.dto.room.RoomResponseDto;
import com.bizsimulator.service.RoomService;
import com.bizsimulator.service.TeacherAnalyticsService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("api/rooms")
@RequiredArgsConstructor
public class RestRoomController {

    private final RoomService roomService;
    private final TeacherAnalyticsService teacherAnalyticsService;

    @PreAuthorize("hasRole('TEACHER')")
    @PostMapping("/teacher/create")
    public ResponseEntity<RoomResponseDto> createRoom(@Valid @RequestBody CreateRoomRequest request,
                                                      Authentication authentication) {
        RoomResponseDto response = roomService.createRoom(request, authentication);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PreAuthorize("hasRole('STUDENT')")
    @PostMapping("/student/join")
    public ResponseEntity<RoomResponseDto> joinRoomByCode(@Valid @RequestBody JoinRoomByCodeRequest request,
                                                          Authentication authentication) {
        RoomResponseDto response = roomService.joinRoomByCode(request, authentication);
        return ResponseEntity.ok(response);
    }

    @PreAuthorize("hasRole('TEACHER')")
    @GetMapping("/teacher/check-rooms")
    public ResponseEntity<List<RoomResponseDto>> checkRooms(Authentication authentication) {
        List<RoomResponseDto> responseList = roomService.getAllRoomByTeacher(authentication);
        return ResponseEntity.ok(responseList);
    }

    @PreAuthorize("hasRole('TEACHER')")
    @PostMapping("/teacher/{roomId}/delete")
    public ResponseEntity<Void> deleteRoom(@PathVariable UUID roomId,
                                           Authentication authentication) {
        roomService.deleteRoom(roomId, authentication);
        return ResponseEntity.noContent().build();
    }

    @PreAuthorize("hasRole('TEACHER')")
    @GetMapping("/{roomId}/participants")
    public ResponseEntity<List<RoomParticipantStudentDto>> getRoomParticipants(@PathVariable UUID roomId,
                                                                               Authentication authentication) {
        return ResponseEntity.ok(teacherAnalyticsService.getRoomParticipant(roomId, authentication));
    }


}
