package com.bizsimulator.controller.rest;

import com.bizsimulator.dto.group.*;
import com.bizsimulator.service.GroupService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/groups")
public class RestGroupController {

    private final GroupService groupService;

    @PostMapping("/create")
    @PreAuthorize("hasRole('TEACHER')")
    public ResponseEntity<GroupResponseDto> createGroup(@RequestBody GroupRequestDto dto,
                                                        Authentication auth) {
        GroupResponseDto groupResponse = groupService.createGroup(dto, auth);
        return ResponseEntity.status(HttpStatus.CREATED).body(groupResponse);
    }

    @PostMapping("/join")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<Void> joinGroup(@RequestBody JoinGroupRequestDto dto,
                                          Authentication auth) {
        groupService.joinGroupByCode(dto, auth);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/my")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<StudentGroupResponseDto> getStudentGroup(Authentication auth) {
        StudentGroupResponseDto response = groupService.getStudentGroupInfo(auth);
        if(response == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }

        return ResponseEntity.ok(response);
    }

    @GetMapping("/teacher")
    @PreAuthorize("hasRole('TEACHER')")
    public ResponseEntity<List<TeacherGroupWithStudentDto>> getTeacherGroupsWithStudents(Authentication auth) {
        List<TeacherGroupWithStudentDto> response = groupService.getTeacherGroupsWithStudents(auth);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{groupId}/code")
    @PreAuthorize("hasRole('TEACHER')")
    public ResponseEntity<GroupResponseDto> getGroupJoinCode(@PathVariable UUID groupId,
                                                             Authentication auth) {
        GroupResponseDto response = groupService.getJoinGroupCode(groupId, auth);
        return ResponseEntity.ok(response);
    }

}
