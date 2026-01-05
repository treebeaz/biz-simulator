package com.bizsimulator.controller;

import com.bizsimulator.dto.user.UserRequestDto;
import com.bizsimulator.dto.user.UserResponseDto;
import com.bizsimulator.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/user")
public class UserController {

    private final UserService userService;

    @GetMapping("/profile")
    public ResponseEntity<UserResponseDto> getInfoByUser() {
        UserResponseDto userResponseDto = userService.getUserInfo(SecurityContextHolder.getContext().getAuthentication());
        return ResponseEntity.status(HttpStatus.OK).body(userResponseDto);
    }

    @PostMapping("/edit-profile")
    public ResponseEntity<UserResponseDto> editProfile(@RequestBody UserRequestDto userRequestDto) {
        UserResponseDto userResponseDto = userService.editProfile(userRequestDto, SecurityContextHolder.getContext().getAuthentication());
        return ResponseEntity.status(HttpStatus.ACCEPTED).body(userResponseDto);
    }
}
