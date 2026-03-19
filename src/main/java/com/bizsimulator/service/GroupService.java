package com.bizsimulator.service;

import com.bizsimulator.dto.group.*;
import com.bizsimulator.entity.Group;
import com.bizsimulator.entity.GroupStudent;
import com.bizsimulator.entity.User;
import com.bizsimulator.entity.UserProfile;
import com.bizsimulator.exception.GroupNotFoundException;
import com.bizsimulator.exception.StudentAlreadyInGroupException;
import com.bizsimulator.exception.StudentNotFoundException;
import com.bizsimulator.repository.GroupRepository;
import com.bizsimulator.repository.GroupStudentRepository;
import com.bizsimulator.util.JoinCodeGenerator;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

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

    public GroupResponseDto getJoinGroupCode(UUID groupId, Authentication authentication) {
        User teacher =  userService.getCurrentAuthenticationUser(authentication);
        Group group = groupRepository.findGroupByIdAndTeacherId(groupId, teacher.getId())
                .orElseThrow(() -> {
                    log.error("GroupService.getJoinGroupCode: Group not found by id");
                    return new GroupNotFoundException("Group not found");
                });

        return buildGroupResponse(group.getName(), group.getJoinCode());
    }

    public StudentGroupResponseDto getStudentGroupInfo(Authentication authentication) throws StudentNotFoundException {
        User student = userService.getCurrentAuthenticationUser(authentication);
        GroupStudent groupStudent = groupStudentRepository.findFirstByStudentId(student.getId())
                .orElseThrow(() -> {
                    log.warn("GroupService.getStudentGroupInfo: Student not found");
                    return new StudentNotFoundException("Student not found");
                });

        Group group = groupStudent.getGroup();
        User teacher = group.getTeacher();

        return StudentGroupResponseDto.builder()
                .groupName(group.getName())
                .teacherName(teacher.getUserProfile().getFirstName() + teacher.getUserProfile().getLastName())
                .teacherEmail(teacher.getEmail())
                .build();
    }

    public List<TeacherGroupWithStudentDto> getTeacherGroupsWithStudents(Authentication authentication) {
        User teacher = userService.getCurrentAuthenticationUser(authentication);

        List<Group> groups = groupRepository.findAllByTeacherId(teacher.getId());

        return groups.stream()
                .map(group -> {
                    List<GroupStudent> groupStudents = groupStudentRepository.findAllByGroupId(group.getId());
                    List<GroupStudentDto> students = getListOfStudents(groupStudents);

                    return TeacherGroupWithStudentDto.builder()
                            .groupId(String.valueOf(group.getId()))
                            .groupName(group.getName())
                            .students(students)
                            .build();
                })
                .toList();
    }

    private List<GroupStudentDto> getListOfStudents(List<GroupStudent> groupStudents) {
        return groupStudents.stream()
                .map(groupStudent -> {
                    User student = groupStudent.getStudent();
                    UserProfile studentProfile = student.getUserProfile();

                    return GroupStudentDto.builder()
                            .studentId(student.getId().toString())
                            .username(student.getUsername())
                            .nameStudent(studentProfile.getFirstName() + " " + studentProfile.getLastName())
                            .emailStudent(student.getEmail())
                            .build();
                })
                .toList();
    }


}
