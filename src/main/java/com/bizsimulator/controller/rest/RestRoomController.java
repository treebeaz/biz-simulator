package com.bizsimulator.controller.rest;

import com.bizsimulator.dto.room.CreateRoomRequest;
import com.bizsimulator.dto.room.JoinRoomByCodeRequest;
import com.bizsimulator.dto.room.RoomResponseDto;
import com.bizsimulator.service.RoomService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("api/rooms")
@RequiredArgsConstructor
public class RestRoomController {
    private final RoomService roomService;

    @PostMapping("/teacher/create")
    public ResponseEntity<RoomResponseDto> createRoom(@Valid @RequestBody CreateRoomRequest request,
                                                      Authentication authentication) {
        RoomResponseDto response = roomService.createRoom(request, authentication);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/student/join")
    public ResponseEntity<RoomResponseDto> joinRoomByCode(@Valid @RequestBody JoinRoomByCodeRequest request,
                                                          Authentication authentication) {
        RoomResponseDto response = roomService.joinRoomByCode(request, authentication);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/teacher/check-rooms")
    public ResponseEntity<List<RoomResponseDto>> checkRooms(Authentication authentication) {
        List<RoomResponseDto> responseList = roomService.getAllRoomByTeacher(authentication);
        return ResponseEntity.ok(responseList);
    }

    @PostMapping("/teacher/{roomId}/delete")
    public ResponseEntity<Void> deleteRoom(@PathVariable UUID roomId,
                                           Authentication authentication) {
        roomService.deleteRoom(roomId, authentication);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{roomId}/participants")
    public ResponseEntity<?> getRoomParticipants(@PathVariable UUID roomId,
                                                 Authentication authentication) {
        // вынести в отдельный сервис RoomParticipantService
        return ResponseEntity.ok("Список участников – будет реализовано");
    }


}
