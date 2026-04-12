package com.bizsimulator.dto.room;

import lombok.Builder;
import lombok.Value;

import java.util.UUID;

@Value
@Builder
public class AddRoomStudentRequestDto {
    UUID studentId;
}
