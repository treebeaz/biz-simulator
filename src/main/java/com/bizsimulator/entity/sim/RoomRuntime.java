package com.bizsimulator.entity.sim;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "room_runtime")
public class RoomRuntime {
    @Id
    @Column(name = "room_id")
    private UUID roomId;

    @Column(name = "current_day", nullable = false)
    private Integer currentDay;

    @Column(name = "is_running", nullable = false)
    private Boolean isRunning;

    @Column(name = "speed_multiplier", nullable = false)
    private Integer speedMultiplier;

    @Column(name = "last_tick_at")
    private LocalDateTime lastTickAt;

    @Column(name = "started_at")
    private LocalDateTime startedAt;

    @Column(name = "finished_at")
    private LocalDateTime finishedAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    public void prePersist() {
        if(currentDay == null) {
            currentDay = 1;
        }
        if(isRunning == null) {
            isRunning = false;
        }
        if(speedMultiplier == null) {
            speedMultiplier = 1;
        }
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    public void preUpdate() {
        updatedAt = LocalDateTime.now();
    }

}
