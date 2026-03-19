package com.bizsimulator.controller.rest;

import com.bizsimulator.dto.user.UserResponseDto;
import com.bizsimulator.dto.user.UserUpdateAccountRequestDto;
import com.bizsimulator.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/user")
public class RestUserController {

    private final UserService userService;

    @GetMapping("/profile")
    public ResponseEntity<UserResponseDto> getInfoByUser(Authentication auth) {
        UserResponseDto userResponse = userService.getUserInfo(auth);
        return ResponseEntity.status(HttpStatus.OK).body(userResponse);
    }

    @PatchMapping("/update-account")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public ResponseEntity<Void> editProfile(@RequestBody UserUpdateAccountRequestDto dto,
                            Authentication auth) {
        userService.updateAccount(dto, auth);
        return ResponseEntity.noContent().build();
    }
}
