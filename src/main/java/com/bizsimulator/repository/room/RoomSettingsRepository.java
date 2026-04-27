package com.bizsimulator.repository.room;

import com.bizsimulator.entity.room.RoomSettings;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface RoomSettingsRepository extends JpaRepository<RoomSettings, UUID> {
    Optional<RoomSettings> findByRoomId(UUID roomId);
}
