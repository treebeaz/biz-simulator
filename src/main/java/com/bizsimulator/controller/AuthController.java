package com.bizsimulator.controller;

import com.bizsimulator.dto.auth.AuthRequestDto;
import com.bizsimulator.dto.auth.AuthResponseDto;
import com.bizsimulator.dto.auth.RegistrationRequestDto;
import com.bizsimulator.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RequiredArgsConstructor
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    @PostMapping("/registration")
    public ResponseEntity<AuthResponseDto> registrationUser(@RequestBody @Valid RegistrationRequestDto request) {
        AuthResponseDto response = authService.registration(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponseDto> loginUser(@RequestBody @Valid AuthRequestDto request) {
        AuthResponseDto response = authService.login(request);
        return ResponseEntity.status(HttpStatus.OK).body(response);
    }
}
