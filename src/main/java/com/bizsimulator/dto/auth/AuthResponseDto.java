package com.bizsimulator.dto.auth;

import com.bizsimulator.entity.Role;
import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class AuthResponseDto {
    String token;
    String username;
    Role role;
}
