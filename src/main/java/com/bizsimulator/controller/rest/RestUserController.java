package com.bizsimulator.controller.rest;

import com.bizsimulator.dto.user.UserResponseDto;
import com.bizsimulator.dto.user.UserUpdateAccountRequestDto;
import com.bizsimulator.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/user")
public class RestUserController {

    private final UserService userService;

    @PreAuthorize("hasAnyRole('STUDENT','TEACHER')")
    @GetMapping("/profile")
    public ResponseEntity<UserResponseDto> getInfoByUser(Authentication auth) {
        UserResponseDto userResponse = userService.getUserInfo(auth);
        return ResponseEntity.status(HttpStatus.OK).body(userResponse);
    }

    @PreAuthorize("hasAnyRole('STUDENT','TEACHER')")
    @PatchMapping("/update-account")
    public ResponseEntity<Void> editProfile(@RequestBody UserUpdateAccountRequestDto dto,
                            Authentication auth) {
        userService.updateAccount(dto, auth);
        return ResponseEntity.noContent().build();
    }
}
