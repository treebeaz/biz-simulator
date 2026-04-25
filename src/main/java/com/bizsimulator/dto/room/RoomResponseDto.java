package com.bizsimulator.dto.room;

import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class RoomResponseDto {
    String id;
    String name;
    String businessType;
    String status;
    Integer maxTurns;
    String joinCode;  // Должно быть null при запросе от студентов
    String teacherId;
    String teacherName;
    Integer participantsCount;
}
