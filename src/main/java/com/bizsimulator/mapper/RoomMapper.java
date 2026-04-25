package com.bizsimulator.mapper;

import com.bizsimulator.dto.room.RoomResponseDto;
import com.bizsimulator.entity.room.Room;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface RoomMapper {
    @Mapping(target = "joinCode", expression = "java(isTeacher ? room.getJoinCode() : null)")
    RoomResponseDto toRoomResponseDto(Room room, boolean isTeacher);
}
