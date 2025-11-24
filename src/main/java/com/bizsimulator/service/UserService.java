package com.bizsimulator.service;

import com.bizsimulator.dto.auth.RegistrationRequestDto;
import com.bizsimulator.entity.User;
import com.bizsimulator.entity.UserProfile;
import com.bizsimulator.exception.UserCreationException;
import com.bizsimulator.exception.UserNotFoundException;
import com.bizsimulator.mapper.UserMapper;
import com.bizsimulator.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class UserService implements UserDetailsService {
    private final UserRepository userRepository;
    private final UserMapper userMapper;
    private final PasswordEncoder passwordEncoder;

    @Transactional
    public User createUser(RegistrationRequestDto request) {
        return Optional.of(request)
                .map(userMapper::userWithProfile)
                .map(user -> {
                    user.setPassword(passwordEncoder.encode(user.getPassword()));
                    return userRepository.save(user);
                })
                .orElseThrow(() -> new UserCreationException("Failed to create user"));
    }

    public boolean existsUserByUsernameOrEmail(String username, String email) {
        return userRepository.existsByUsernameOrEmail(username, email);
    }

    @Override
    public UserDetails loadUserByUsername(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));

        return org.springframework.security.core.userdetails.User.builder()
                .username(user.getUsername())
                .password(user.getPassword())
                .authorities(this.getRole(user.getRole().name()))
                .build();
    }

    private String getRole(String role) {
        return "ROLE_" + role;
    }

    public User findByUsername(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new UserNotFoundException("User not found"));
    }
}
