package com.bizsimulator.repository;

import com.bizsimulator.entity.Group;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface GroupRepository extends JpaRepository<Group, UUID> {
    boolean existsByJoinCode(String joinCode);
    Optional<Group> findByJoinCode(String joinCode);
}
