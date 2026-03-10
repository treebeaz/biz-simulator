package com.bizsimulator.dto.group;

import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class JoinGroupRequestDto {
    String name;
    String joinCode;
}
