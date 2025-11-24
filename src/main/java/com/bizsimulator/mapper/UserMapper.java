package com.bizsimulator.mapper;

import com.bizsimulator.dto.auth.RegistrationRequestDto;
import com.bizsimulator.entity.User;
import com.bizsimulator.entity.UserProfile;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface UserMapper {
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "userProfile", ignore = true)
    User toUser(RegistrationRequestDto request);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "user", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    UserProfile toUserProfile(RegistrationRequestDto request);

    default User userWithProfile(RegistrationRequestDto request) {
        User user = toUser(request);
        UserProfile userProfile = toUserProfile(request);

        user.setUserProfile(userProfile);
        return user;
    }
}
