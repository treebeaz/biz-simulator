package com.bizsimulator.repository.simulation;

import com.bizsimulator.entity.simulation.StudentGrade;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface StudentGradeRepository extends JpaRepository<StudentGrade, UUID> {
    Optional<StudentGrade> findByRoomIdAndStudentId(UUID roomId, UUID studentId);
}
