package com.bizsimulator.controller.rest;

import com.bizsimulator.dto.simulation.MakeTurnRequestDto;
import com.bizsimulator.dto.simulation.TurnResultDto;
import com.bizsimulator.service.SimulationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("api/simulation")
@RequiredArgsConstructor
public class RestSimulationController {
    private final SimulationService simulationService;

    @PostMapping("/rooms/{roomId}/turn")
    public ResponseEntity<TurnResultDto> makeTurn(@PathVariable("roomId") UUID roomId,
                                                  @Valid @RequestBody MakeTurnRequestDto request,
                                                  Authentication authentication) {
        TurnResultDto response = simulationService.makeTurn(roomId, request, authentication);
        return ResponseEntity.ok(response);

    }
}
