package com.bizsimulator.repository.simulation;

import com.bizsimulator.entity.simulation.ActiveEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ActiveEventRepository extends JpaRepository<ActiveEvent, UUID> {
    List<ActiveEvent> findByRoomParticipantId(UUID roomParticipantId);

    void deleteByRoomParticipantId(UUID roomParticipantId);
}
