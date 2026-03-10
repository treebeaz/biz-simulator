package com.bizsimulator.dto.group;

import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class GroupResponseDto {
    String name;
    String code;
}
