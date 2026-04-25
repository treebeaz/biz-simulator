package com.bizsimulator.repository.room;

import com.bizsimulator.dto.room.RoomResponseDto;
import com.bizsimulator.entity.room.Room;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface RoomRepository extends JpaRepository<Room, UUID> {
    Optional<Room> findByJoinCode(String joinCode);

    List<Room> findAllByTeacherId(UUID teacherId);
}
