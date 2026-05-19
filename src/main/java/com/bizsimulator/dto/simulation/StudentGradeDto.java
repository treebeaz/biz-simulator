package com.bizsimulator.dto.simulation;

import lombok.Builder;
import lombok.Value;

import java.time.LocalDateTime;
import java.util.UUID;

@Value
@Builder
public class StudentGradeDto {
    UUID roomId;
    UUID studentId;
    Integer gradeValue;
    String comment;
    LocalDateTime updatedAt;
}
