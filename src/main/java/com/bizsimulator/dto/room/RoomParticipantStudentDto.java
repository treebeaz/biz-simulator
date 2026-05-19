package com.bizsimulator.dto.room;

import lombok.Builder;
import lombok.Value;

import java.util.UUID;

@Value
@Builder
public class RoomParticipantStudentDto {
    UUID studentId;
    String username;
    String email;
    String fullName;
    Integer currentStep;
}
