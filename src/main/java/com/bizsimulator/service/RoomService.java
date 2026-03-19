package com.bizsimulator.service;

import com.bizsimulator.dto.room.RoomRequestDto;
import com.bizsimulator.dto.room.RoomResponseDto;
import com.bizsimulator.entity.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@RequiredArgsConstructor
@Service
@Slf4j
public class RoomService {

    private final UserService userService;

    @Transactional
    public RoomResponseDto createRoom(RoomRequestDto roomRequestDto,
                                      Authentication authentication) {

        User teacher = userService.getCurrentAuthenticationUser(authentication);

        return RoomResponseDto.builder()
                .build();
    }
}
