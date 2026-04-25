package com.bizsimulator.repository.group;

import com.bizsimulator.entity.group.Group;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface GroupRepository extends JpaRepository<Group, UUID> {
    boolean existsByJoinCode(String joinCode);

    Optional<Group> findByJoinCode(String joinCode);

    Optional<Group> findGroupByIdAndTeacherId(UUID groupId, UUID teacherId);

    List<Group> findAllByTeacherId(UUID id);
}
