package com.bizsimulator.controller.rest;

import com.bizsimulator.dto.room.RoomResponseDto;
import com.bizsimulator.dto.sim.RoomRuntimeResponseDto;
import com.bizsimulator.dto.sim.StudentDecisionRequestDto;
import com.bizsimulator.dto.sim.StudentStateResponseDto;
import com.bizsimulator.entity.sim.RoomSimMetaDto;
import com.bizsimulator.entity.sim.RoomSimResponseDto;
import com.bizsimulator.service.SimulationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/sim")
public class RestSimulationController {

    private final SimulationService  simulationService;

    @PostMapping("/teacher/rooms/{roomId}/start")
    @PreAuthorize("hasRole('TEACHER')")
    public ResponseEntity<RoomRuntimeResponseDto> startRoom(@PathVariable UUID roomId,
                                                            Authentication authentication) {
        return ResponseEntity.ok(simulationService.startRoom(roomId, authentication));
    }

    @PostMapping("/teacher/rooms/{roomId}/pause")
    @PreAuthorize("hasRole('TEACHER')")
    public ResponseEntity<RoomRuntimeResponseDto> pauseRoom(@PathVariable UUID roomId,
                                                            Authentication authentication) {
        return ResponseEntity.ok(simulationService.pauseRoom(roomId, authentication));
    }

    @PostMapping("/teacher/rooms/{roomId}/resume")
    @PreAuthorize("hasRole('TEACHER')")
    public ResponseEntity<RoomRuntimeResponseDto> resumeRoom(@PathVariable UUID roomId,
                                                             Authentication authentication) {
        return ResponseEntity.ok(simulationService.resumeRoom(roomId, authentication));
    }

    @PostMapping("/teacher/rooms/{roomId}/speed/{speed}")
    @PreAuthorize("hasRole('TEACHER')")
    public ResponseEntity<RoomRuntimeResponseDto> setSpeed(@PathVariable UUID roomId,
                                                           @PathVariable Integer speed,
                                                           Authentication authentication) {
        return ResponseEntity.ok(simulationService.setSpeed(roomId, speed, authentication));
    }

    @PostMapping("/decision")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<Void> submitDecision(@RequestBody StudentDecisionRequestDto request,
                                               Authentication authentication) {
        simulationService.submitDecision(request, authentication);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/rooms/{roomId}/my-state")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<StudentStateResponseDto> getMyState(@PathVariable UUID roomId,
                                                              Authentication authentication) {
        return ResponseEntity.ok(simulationService.getStudentState(roomId, authentication));
    }

    @GetMapping("/my-room")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<RoomSimResponseDto> getMyRoom(Authentication authentication) {
        return ResponseEntity.ok(simulationService.getMyRooms(authentication));
    }

    @GetMapping("/rooms/{roomId}/runtime")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<RoomRuntimeResponseDto> getRuntimeForStudent(@PathVariable UUID roomId,
                                                                       Authentication authentication) {
        return ResponseEntity.ok(simulationService.getRuntimeForStudent(roomId, authentication));
    }

    @PostMapping("/rooms/{roomId}/start")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<RoomRuntimeResponseDto> startRoomByStudent(@PathVariable UUID roomId,
                                                                     Authentication authentication) {
        return ResponseEntity.ok(simulationService.startRoomByStudent(roomId, authentication));
    }

    @PostMapping("/rooms/{roomId}/pause")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<RoomRuntimeResponseDto> pauseRoomByStudent(@PathVariable UUID roomId,
                                                                     Authentication authentication) {
        return ResponseEntity.ok(simulationService.pauseRoomByStudent(roomId, authentication));
    }

    @PostMapping("/rooms/{roomId}/resume")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<RoomRuntimeResponseDto> resumeRoomByStudent(@PathVariable UUID roomId,
                                                                      Authentication authentication) {
        return ResponseEntity.ok(simulationService.resumeRoomByStudent(roomId, authentication));
    }

    @PostMapping("/rooms/{roomId}/speed/{speed}")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<RoomRuntimeResponseDto> setSpeedByStudent(@PathVariable UUID roomId,
                                                                    @PathVariable Integer speed,
                                                                    Authentication authentication) {
        return ResponseEntity.ok(simulationService.setSpeedByStudent(roomId, speed, authentication));
    }

    @PostMapping("/rooms/{roomId}/finish")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<RoomRuntimeResponseDto> finishRoomByStudent(@PathVariable UUID roomId,
                                                                      Authentication authentication) {
        return ResponseEntity.ok(simulationService.finishRoomByStudent(roomId, authentication));
    }

    @PostMapping("/rooms/{roomId}/respawn")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<RoomRuntimeResponseDto> respawnRoomByStudent(@PathVariable UUID roomId,
                                                                       Authentication authentication) {
        return ResponseEntity.ok(simulationService.restartRoomByStudent(roomId, authentication));
    }

    @GetMapping("/rooms/{roomId}/meta")
    public RoomSimMetaDto getRoomMeta(@PathVariable UUID roomId,
                                      Authentication authentication) {
        return simulationService.getMetaData(roomId, authentication);
    }
}
