package com.bizsimulator.service;

import com.bizsimulator.dto.auth.AuthRequestDto;
import com.bizsimulator.dto.auth.AuthResponseDto;
import com.bizsimulator.dto.auth.RegistrationRequestDto;
import com.bizsimulator.entity.Role;
import com.bizsimulator.entity.User;
import com.bizsimulator.exception.InvalidCredentialsException;
import com.bizsimulator.exception.UserAlreadyExistsException;
import com.bizsimulator.util.JwtUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {
    private final UserService userService;
    private final JwtUtil jwtUtil;
    private final AuthenticationManager authenticationManager;

    public AuthResponseDto registration(RegistrationRequestDto request) {
        if(userService.existsUserByUsernameOrEmail(request.getUsername(), request.getEmail())) {
            log.error("AuthService.registration.failed.UserAlreadyExists");
            throw new UserAlreadyExistsException("User already exists");
        }

        User user = userService.createUser(request);
        String token = jwtUtil.generateToken(user);

        log.info("AuthService.registration.tokenCreated");

        return buildAuthResponse(token, user.getUsername(), user.getRole());
    }

    public AuthResponseDto login(AuthRequestDto request)  {
        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            request.getUsername(),
                            request.getPassword()
                    )
            );

            UserDetails userDetails = (UserDetails) authentication.getPrincipal();
            User user = userService.findByUsername(userDetails.getUsername());
            String token = jwtUtil.generateToken(user);

            log.info("AuthService.login.success.forUser: {}", user.getUsername());

            return buildAuthResponse(token, user.getUsername(), user.getRole());

        } catch (BadCredentialsException e) {
            log.error("AuthService.login.fail.InvalidCredentials");
            throw new InvalidCredentialsException("Invalid username or password");
        }
    }

    private AuthResponseDto buildAuthResponse(String token, String username, Role role) {
        return AuthResponseDto.builder()
                .token(token)
                .username(username)
                .role(role)
                .build();
    }
}
