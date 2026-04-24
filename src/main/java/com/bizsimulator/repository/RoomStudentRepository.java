package com.bizsimulator.repository;

import com.bizsimulator.entity.RoomStudent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface RoomStudentRepository extends JpaRepository<RoomStudent, UUID> {
    List<RoomStudent> findAllByRoomId(UUID roomId);
    boolean existsByRoomIdAndStudentId(UUID roomId, UUID studentId);
    Optional<RoomStudent> findByRoomIdAndStudentId(UUID roomId, UUID studentId);
    Optional<RoomStudent> findFirstByStudentId(UUID studentId);
}
