package com.bizsimulator.service;

import com.bizsimulator.dto.auth.RegistrationRequestDto;
import com.bizsimulator.dto.user.UserResponseDto;
import com.bizsimulator.dto.user.UserUpdateAccountRequestDto;
import com.bizsimulator.entity.User;
import com.bizsimulator.entity.UserProfile;
import com.bizsimulator.exception.*;
import com.bizsimulator.mapper.UserMapper;
import com.bizsimulator.repository.UserProfileRepository;
import com.bizsimulator.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
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
    private final UserProfileRepository userProfileRepository;
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
                .orElseThrow(() -> {
                    log.error("UserService.findByUsername.error.InvalidUsername");
                    return new InvalidUsernameException("Invalid username");
                });
    }

    public UserResponseDto getUserInfo(Authentication authentication) {
        // TODO: Добавить больше информации в личный кабинет
        User user = getCurrentAuthenticationUser(authentication);
        UserProfile userProfile = findUserProfileByEmailOrUsername(user);
        return buildResponse(user, userProfile);
    }

    protected User getCurrentAuthenticationUser(Authentication authentication) {
        if (!(authentication.getPrincipal() instanceof UserDetails userDetails)) {
            log.error("UserService.getCurrentAuthenticationUser.error.InvalidPrincipalTypeInAuthentication");
            throw new InvalidAuthenticationException("Authentication type does not match with User");
        }

        return this.findByUsername(userDetails.getUsername());
    }

    public UserProfile findUserProfileByEmailOrUsername(User user) {
        return userProfileRepository.findByUserId(user.getId())
                .orElseThrow(() -> {
                    log.error("UserService.findUserProfileByEmailOrUsername.error.UserDoesNotExist");
                    return new UserNotFoundException("User not found");
                });
    }

    private UserResponseDto buildResponse(User user, UserProfile profile) {
        return UserResponseDto.builder()
                .firstName(profile.getFirstName())
                .lastName(profile.getLastName())
                .username(user.getUsername())
                .email(user.getEmail())
                .build();
    }

    @Transactional
    public void updateAccount(UserUpdateAccountRequestDto updateAccountDto, Authentication authentication) {
        User user = getCurrentAuthenticationUser(authentication);

        updateEmail(updateAccountDto.getEmail(), user);
        updatePassword(updateAccountDto.getPassword(), user);

        userRepository.save(user);
    }

    private void updateEmail(String newEmail, User user) {
        if (newEmail == null || newEmail.equals(user.getEmail())) {
            return;
        }

        if (userRepository.existsByEmail(newEmail)) {
            log.info("UserService.updateAccount.error.EmailAlreadyExists");
            throw new UpdateUserAccountException("User with this email already exists");
        }

        log.info("UserService.updateEmail.success");
        user.setEmail(newEmail);
    }

    private void updatePassword(String newPassword, User user) {
        if (newPassword == null || newPassword.isBlank()) {
            return;
        }

        log.info("UserService.updatePassword.success");
        user.setPassword(passwordEncoder.encode(newPassword));
    }


}
