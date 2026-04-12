package com.bizsimulator.dto.room;

import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class RoomStudentDto {
    String studentId;
    String username;
    String fullName;
    String email;
    String status;
    Integer attemptNo;
    String joinedAt;
}
