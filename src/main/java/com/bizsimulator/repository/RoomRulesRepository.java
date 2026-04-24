package com.bizsimulator.repository;

import com.bizsimulator.entity.RoomRules;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface RoomRulesRepository extends JpaRepository<RoomRules, UUID> {

}
