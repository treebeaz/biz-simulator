package com.bizsimulator.entity.simulation;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "active_events")
public class ActiveEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "room_participant_id", nullable = false)
    private UUID roomParticipantId;

    @Column(name = "event_template_id", nullable = false)
    private UUID eventTemplateId;

    @Column(name = "remaining_steps", nullable = false)
    private Integer remainingSteps;

    @Column(name = "multiplier_staff")
    private BigDecimal multiplierStaff;

    @Column(name = "multiplier_cost")
    private BigDecimal multiplierCost;

    @Column(name = "multiplier_demand")
    private BigDecimal multiplierDemand;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    public void prePersist() {
        if (multiplierStaff == null) {
            multiplierStaff = BigDecimal.ONE;
        }
        if (multiplierCost == null) {
            multiplierCost = BigDecimal.ONE;
        }
        if (multiplierDemand == null) {
            multiplierDemand = BigDecimal.ONE;
        }
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        if (updatedAt == null) {
            updatedAt = LocalDateTime.now();
        }
    }

    @PreUpdate
    public void preUpdate() {
        updatedAt = LocalDateTime.now();
    }

}
