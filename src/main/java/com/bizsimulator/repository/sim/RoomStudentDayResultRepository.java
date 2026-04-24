package com.bizsimulator.repository.sim;

import com.bizsimulator.entity.sim.RoomStudentDayResult;
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
public interface RoomStudentDayResultRepository extends JpaRepository<RoomStudentDayResult, UUID> {
    Optional<RoomStudentDayResult> findByRoomIdAndStudentIdAndDayNo(UUID roomId, UUID studentId, Integer dayNo);


    @Transactional
    @Modifying
    @Query("delete from RoomStudentDayResult r where r.roomId = :roomId")
    void deleteAllByRoomId(@Param("roomId") UUID roomId);
}
