package com.bizsimulator.controller.rest;

import com.bizsimulator.dto.room.RoomSettingsDto;
import com.bizsimulator.dto.room.UpdateRoomSettingsRequestDto;
import com.bizsimulator.service.RoomSettingsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("api/rooms/{roomId}/settings")
@RequiredArgsConstructor
public class RoomSettingsController {
    private final RoomSettingsService roomSettingsService;

    @GetMapping
//    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<RoomSettingsDto> getSettings(@PathVariable("roomId") UUID roomId) {
        return ResponseEntity.ok(roomSettingsService.getSettingsByRoomId(roomId));
    }

    @PutMapping
    @PreAuthorize("hasRole('TEACHER')")
    public ResponseEntity<RoomSettingsDto> updateSettings(@PathVariable("roomId") UUID roomId,
                                                          @RequestBody UpdateRoomSettingsRequestDto request) {
        return ResponseEntity.ok(roomSettingsService.updateSettings(roomId, request));
    }
}
