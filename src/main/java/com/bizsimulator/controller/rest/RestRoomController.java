package com.bizsimulator.controller.rest;

import com.bizsimulator.dto.room.RoomRequestDto;
import com.bizsimulator.dto.room.RoomResponseDto;
import com.bizsimulator.service.RoomService;
import lombok.RequiredArgsConstructor;
import org.apache.coyote.Response;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/rooms")
@PreAuthorize("hasRole('TEACHER')")
public class RestRoomController {
    private final RoomService roomService;

    @PostMapping
    public ResponseEntity<RoomResponseDto> createRoom(@RequestBody RoomRequestDto roomRequestDto,
                                                      Authentication authentication) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(roomService.createRoom(roomRequestDto, authentication));
    }

    @GetMapping
    public ResponseEntity<List<RoomResponseDto>> getAllRooms(Authentication authentication) {
        return ResponseEntity.status(HttpStatus.OK)
                .body(roomService.getTeacherRooms(authentication));
    }

    @DeleteMapping("/{roomId}")
    public ResponseEntity<Void> deleteRoom(@PathVariable UUID roomId,
                                           Authentication authentication) {
        roomService.deleteRoom(roomId, authentication);
        return ResponseEntity.noContent().build();
    }
}
