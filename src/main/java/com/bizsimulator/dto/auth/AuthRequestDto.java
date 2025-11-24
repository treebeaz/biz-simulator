package com.bizsimulator.dto.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class AuthRequestDto {
    @Size(min = 5, max = 50, message = "Username must be between 3 and 50 characters")
    @Pattern(regexp = "^[a-zA-Z0-9]*$", message = "Username can only contain letters and numbers")
    String username;

    @Email(message = "Email should be valid")
    @Size(max = 100, message = "Email must not exceed 100 characters")
    String email;

    @NotBlank(message = "Password is required")
    @Size(min = 1, message = "Password must not be empty")
    String password;
}
