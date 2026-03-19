package com.bizsimulator.dto.group;

import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class GroupStudentDto {
    String studentId;
    String username;
    String nameStudent;
    String emailStudent;

}
