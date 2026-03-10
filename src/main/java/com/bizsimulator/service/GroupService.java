package com.bizsimulator.service;

import com.bizsimulator.dto.group.GroupRequestDto;
import com.bizsimulator.dto.group.GroupResponseDto;
import com.bizsimulator.dto.group.JoinGroupRequestDto;
import com.bizsimulator.entity.Group;
import com.bizsimulator.entity.GroupStudent;
import com.bizsimulator.entity.User;
import com.bizsimulator.exception.GroupNotFoundException;
import com.bizsimulator.exception.StudentAlreadyInGroupException;
import com.bizsimulator.repository.GroupRepository;
import com.bizsimulator.repository.GroupStudentRepository;
import com.bizsimulator.util.JoinCodeGenerator;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@RequiredArgsConstructor
@Slf4j
@Service
@Transactional(readOnly = true)
public class GroupService {
    private final GroupRepository groupRepository;
    private final GroupStudentRepository groupStudentRepository;
    private final JoinCodeGenerator joinCodeGenerator;
    private final UserService userService;

    @Transactional
//    @PreAuthorize("hasRole('TEACHER')")
    public GroupResponseDto createGroup(GroupRequestDto groupRequestDto, Authentication authentication) {
        String joinCode = joinCodeGenerator.generate();
        Group group = Group.builder()
                .name(groupRequestDto.getName())
                .joinCode(joinCode)
                .teacher(userService.getCurrentAuthenticationUser(authentication))
                .build();

        groupRepository.save(group);
        log.info("GroupService.createGroup: Group and invitation code successfully created");
        return buildGroupResponse(group.getName(), group.getJoinCode());
    }

    private GroupResponseDto buildGroupResponse(String name, String code) {
        return GroupResponseDto.builder()
                .name(name)
                .code(code)
                .build();
    }

    @Transactional
    public void joinGroupByCode(JoinGroupRequestDto joinGroupRequest, Authentication authentication) {
        Group group = groupRepository.findByJoinCode(joinGroupRequest.getJoinCode())
                .orElseThrow(() -> {
                    log.error("GroupService.joinGroupByCode: Group not found by join code");
                    return new GroupNotFoundException("Group not found");
                });

        User student = userService.getCurrentAuthenticationUser(authentication);

        if (groupStudentRepository.existsByGroupIdAndStudentId(group.getId(), student.getId())) {
            log.error("GroupService.joinGroupByCode: Student {} already in group {}", student.getUserProfile().getFirstName(), group.getName());
            throw new StudentAlreadyInGroupException("Student already joined this group");
        }

        GroupStudent groupStudent = GroupStudent.builder()
                .group(group)
                .student(student)
                .build();

        groupStudentRepository.save(groupStudent);
        log.info("GroupService.joinGroupByCode: Student successfully joined group");
    }


}
