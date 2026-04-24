package com.bizsimulator.repository.sim;

import com.bizsimulator.entity.sim.RoomRuntime;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface RoomRuntimeRepository extends JpaRepository<RoomRuntime, UUID> {
    List<RoomRuntime> findAllByIsRunningTrue();
}
