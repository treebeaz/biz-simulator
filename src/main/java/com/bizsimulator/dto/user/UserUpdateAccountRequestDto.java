package com.bizsimulator.dto.user;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;
import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class UserUpdateAccountRequestDto {
    @Email String email;
    @Size(min = 7, max = 50) String password;
}
