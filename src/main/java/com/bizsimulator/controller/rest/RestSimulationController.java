package com.bizsimulator.controller.rest;

import com.bizsimulator.dto.simulation.MakeTurnRequestDto;
import com.bizsimulator.dto.simulation.TurnHistoryEntryDto;
import com.bizsimulator.dto.simulation.TurnResultDto;
import com.bizsimulator.service.SimulationService;
import com.bizsimulator.service.TeacherAnalyticsService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("api/simulation/rooms/{roomId}")
@RequiredArgsConstructor
public class RestSimulationController {

    private final SimulationService simulationService;
    private final TeacherAnalyticsService teacherAnalyticsService;

    @PreAuthorize("hasRole('STUDENT')")
    @PostMapping("/turn")
    public ResponseEntity<TurnResultDto> makeTurn(@PathVariable("roomId") UUID roomId,
                                                  @Valid @RequestBody MakeTurnRequestDto request,
                                                  Authentication authentication) {
        TurnResultDto response = simulationService.makeTurn(roomId, request, authentication);
        return ResponseEntity.ok(response);
    }

    @PreAuthorize("hasRole('STUDENT')")
    @PostMapping("/reset")
    public ResponseEntity<TurnResultDto> reset(@PathVariable("roomId") UUID roomId,
                                               Authentication authentication) {
        return ResponseEntity.ok(simulationService.resetGame(roomId, authentication));
    }

    @PreAuthorize("hasRole('TEACHER')")
    @GetMapping("/participant/{studentId}/history")
    public ResponseEntity<List<TurnHistoryEntryDto>> teacherStudentHistory(@PathVariable("roomId") UUID roomId,
                                                                           @PathVariable("studentId") UUID studentId,
                                                                           Authentication authentication) {
        return ResponseEntity.ok(teacherAnalyticsService.getStudentTurnHistory(roomId, studentId, authentication));
    }
}
