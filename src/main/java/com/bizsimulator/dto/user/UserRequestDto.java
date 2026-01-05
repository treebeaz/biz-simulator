package com.bizsimulator.dto.user;

import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class UserRequestDto {
    String username;
    String email;
    String password;
}
