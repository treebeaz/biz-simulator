package com.bizsimulator.repository.simulation;

import com.bizsimulator.entity.simulation.TurnHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface TurnHistoryRepository extends JpaRepository<TurnHistory, UUID> {
    void deleteByRoomParticipantId(UUID roomParticipantId);

    List<TurnHistory> findByRoomParticipantIdOrderByStepAsc(UUID roomParticipantId);
}

