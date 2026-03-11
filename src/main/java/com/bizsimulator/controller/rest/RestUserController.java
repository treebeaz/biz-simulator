package com.bizsimulator.controller.rest;

import com.bizsimulator.dto.group.GroupRequestDto;
import com.bizsimulator.dto.group.GroupResponseDto;
import com.bizsimulator.dto.group.JoinGroupRequestDto;
import com.bizsimulator.dto.user.UserResponseDto;
import com.bizsimulator.dto.user.UserUpdateAccountRequestDto;
import com.bizsimulator.service.GroupService;
import com.bizsimulator.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/user")
public class RestUserController {

    private final UserService userService;
    private final GroupService groupService;

    @GetMapping("/profile")
    public ResponseEntity<UserResponseDto> getInfoByUser() {
        UserResponseDto userResponseDto = userService.getUserInfo(SecurityContextHolder.getContext().getAuthentication());
        return ResponseEntity.status(HttpStatus.OK).body(userResponseDto);
    }

    @PatchMapping("/update-account")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void editProfile(@RequestBody UserUpdateAccountRequestDto dto) {
        userService.updateAccount(dto, SecurityContextHolder.getContext().getAuthentication());
    }

    @PostMapping("/create-group")
    @PreAuthorize("hasRole('TEACHER')")
    public ResponseEntity<GroupResponseDto> createGroup(@RequestBody GroupRequestDto dto) {
        GroupResponseDto groupResponseDto = groupService.createGroup(dto, SecurityContextHolder.getContext().getAuthentication());
        return ResponseEntity.status(HttpStatus.CREATED).body(groupResponseDto);
    }

    @PostMapping("/join-group")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<Void> joinGroup(@RequestBody JoinGroupRequestDto dto) {
        groupService.joinGroupByCode(dto, SecurityContextHolder.getContext().getAuthentication());
        return ResponseEntity.noContent().build();
    }
}
