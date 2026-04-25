package com.bizsimulator.entity.room;

import jakarta.persistence.*;
import lombok.Builder;
import lombok.Getter;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "room_participants", uniqueConstraints = {
        @UniqueConstraint(columnNames = {
                "room_id", "user_id"
        })
})
public class RoomParticipant {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "room_id", nullable = false)
    private UUID roomId;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "current_step", nullable = false)
    private Integer currentStep;

    @Column(name = "joined_at")
    private LocalDateTime joinedAt;

    @PrePersist
    public void prePersist() {
        if(joinedAt == null) {
            joinedAt = LocalDateTime.now();
        }
    }
}
