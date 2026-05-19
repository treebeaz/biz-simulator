package com.bizsimulator.dto.simulation;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class UpsertStudentGradeRequestDto {
    @Min(0)
    @Max(100)
    Integer gradeValue;

    String comment;
}
