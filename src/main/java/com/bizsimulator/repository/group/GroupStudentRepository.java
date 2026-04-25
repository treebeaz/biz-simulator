package com.bizsimulator.repository.group;

import com.bizsimulator.entity.group.GroupStudent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface GroupStudentRepository extends JpaRepository<GroupStudent, UUID> {
    boolean existsByGroupIdAndStudentId(UUID groupId, UUID studentId);

    Optional<GroupStudent> findFirstByStudentId(UUID studentId);

    List<GroupStudent> findAllByGroupId(UUID groupId);
}
