package com.bizsimulator.dto.group;

import lombok.Builder;
import lombok.Value;

import java.util.List;

@Value
@Builder
public class TeacherGroupWithStudentDto {
    String groupId;
    String groupName;
    List<GroupStudentDto> students;
}
