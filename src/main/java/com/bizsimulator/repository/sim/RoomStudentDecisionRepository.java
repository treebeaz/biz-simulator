package com.bizsimulator.repository.sim;

import com.bizsimulator.entity.sim.RoomStudentDecision;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface RoomStudentDecisionRepository extends JpaRepository<RoomStudentDecision, UUID> {
    Optional<RoomStudentDecision> findByRoomIdAndStudentIdAndDayNo(UUID roomId, UUID studentId, Integer dayNo);

    @Transactional
    @Modifying
    @Query("delete from RoomStudentDecision d where d.roomId = :roomId")
    void deleteAllByRoomId(@Param("roomId") UUID roomId);
}
