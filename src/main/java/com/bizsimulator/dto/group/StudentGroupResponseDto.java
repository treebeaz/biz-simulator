package com.bizsimulator.dto.group;

import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class StudentGroupResponseDto {
    String groupName;
    String teacherName;
    String teacherEmail;
}
