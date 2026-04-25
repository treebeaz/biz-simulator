package com.bizsimulator.repository.room;

import com.bizsimulator.entity.room.RoomParticipant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface RoomParticipantRepository extends JpaRepository<RoomParticipant, UUID> {

    boolean existsByRoomIdAndUserId(UUID roomId, UUID userId);
}
