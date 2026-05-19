package com.bizsimulator.repository.simulation;

import com.bizsimulator.entity.enums.BusinessType;
import com.bizsimulator.entity.simulation.EventTemplate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface EventTemplateRepository extends JpaRepository<EventTemplate, UUID> {
    List<EventTemplate> findByBusinessType(BusinessType businessType);
}
