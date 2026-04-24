package com.bizsimulator.dto.group;

import lombok.Builder;
import lombok.Value;

import java.util.List;

@Value
@Builder
public class StudentGroupResponseDto {
    String groupName;
    String teacherName;
    String teacherEmail;
    List<ClassmateDto> classmate;
}
