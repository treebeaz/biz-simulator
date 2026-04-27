package com.bizsimulator.mapper;

import com.bizsimulator.dto.room.RoomSettingsDto;
import com.bizsimulator.dto.room.UpdateRoomSettingsRequestDto;
import com.bizsimulator.entity.room.RoomSettings;
import org.mapstruct.Mapper;
import org.mapstruct.MappingTarget;
import org.mapstruct.NullValuePropertyMappingStrategy;

@Mapper(componentModel = "spring",
        nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
public interface RoomSettingsMapper {
    RoomSettingsDto toRoomSettingsDto(RoomSettings roomSettings);

    void updateRoomSettingsFromDto(UpdateRoomSettingsRequestDto dto,
                                   @MappingTarget RoomSettings roomSettings);
}
