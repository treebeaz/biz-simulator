package com.bizsimulator.dto.user;

import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class UserResponseDto {
    String firstName;
    String lastName;
    String username;
}
