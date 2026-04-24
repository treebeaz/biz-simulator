package com.bizsimulator.repository.sim;

import com.bizsimulator.entity.sim.RoomStudentState;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface RoomStudentStateRepository extends JpaRepository<RoomStudentState, UUID> {
    List<RoomStudentState> findAllByRoomId(UUID roomId);
    Optional<RoomStudentState> findByRoomIdAndStudentId(UUID roomId, UUID studentId);

    @Transactional
    @Modifying
    @Query("delete from RoomStudentState s where s.roomId = :roomId")
    void deleteAllByRoomId(@Param("roomId") UUID roomId);
}
