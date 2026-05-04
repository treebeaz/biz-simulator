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
@Table(name = "game_states")
public class GameState {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "room_participant_id", nullable = false, unique = true)
    private UUID roomParticipantId;

    @Column(name = "step", nullable = false)
    private Integer step;

    @Column(name = "cash", nullable = false)
    private BigDecimal cash;

    @Column(name = "stock", nullable = false)
    private Integer stock;

    @Column(name = "staff", nullable = false)
    private BigDecimal staff;

    @Column(name = "current_cost", nullable = false)
    private BigDecimal currentCost;

    @Column(name = "last_marketing", nullable = false)
    private BigDecimal lastMarketing;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    public void prePersist() {
        if (step == null) {
            step = 0;
        }
        if (lastMarketing == null) {
            lastMarketing = BigDecimal.ZERO;
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
