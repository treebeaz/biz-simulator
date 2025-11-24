package com.bizsimulator.dto.auth;

import com.bizsimulator.entity.Role;
import jakarta.validation.constraints.*;
import lombok.Builder;
import lombok.Value;

import java.util.Date;

@Value
@Builder
public class RegistrationRequestDto {
    @NotBlank(message = "Username is required")
    @Size(min = 5, max = 50, message = "Username must contain at least 5 characters")
    @Pattern(regexp = "^[a-zA-Z0-9]+$", message = "The username must contain only letters and numbers")
    String username;

    @NotBlank(message = "Email is required")
    @Email(message = "Email should be valid")
    @Size(max = 100, message = "Email must not exceed 100 characters")
    String email;

    @NotBlank(message = "Password is required")
    @Size(min = 7, max = 50, message = "The password must contain at least 7 characters")
    String password;

    @NotNull(message = "Role is required")
    Role role;

    @NotBlank(message = "Firstname is required")
    @Size(min = 2, max = 50, message = "Firstname must be between 2 and 50 characters")
    @Pattern(regexp = "^[A-Z].*", message = "The firstname must begin with a capital letter")
    String firstName;

    @NotBlank(message = "Lastname is required")
    @Size(min = 2, max = 50, message = "Lastname must be between 2 and 50 characters")
    @Pattern(regexp = "^[A-Z].*", message = "The lastname must begin with a capital letter")
    String lastName;

    @NotNull(message = "Birth date is required")
    @Past(message = "Birth date must be in the past")
    Date birthDate;
}
