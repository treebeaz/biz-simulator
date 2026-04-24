package com.bizsimulator.dto.group;

import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class ClassmateDto {
    String studentId;
    String username;
    String fullName;
    String email;
}
