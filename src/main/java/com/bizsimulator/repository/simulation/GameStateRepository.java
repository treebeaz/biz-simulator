package com.bizsimulator.repository.simulation;

import com.bizsimulator.entity.simulation.GameState;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface GameStateRepository extends JpaRepository<GameState, UUID> {
    Optional<GameState> findByRoomParticipantId(UUID roomParticipantId);
}
