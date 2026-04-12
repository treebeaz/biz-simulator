package com.bizsimulator.entity;

import com.bizsimulator.entity.enums.RoomStudentStatus;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;
// TODO: создать класс для студентов, которые состоят в комнате. Далее создать контроллер и в сервисе прописать
// TODO: логику для добавления этих студентов в комнату.
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "room_students")
public class RoomStudent {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "room_id", nullable = false)
    private UUID roomId;

    @Column(name = "student_id", nullable = false)
    private UUID studentId;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private RoomStudentStatus status;

    @Column(name = "attempt_no", nullable = false)
    private Integer attemptNo;

    @Column(name = "joined_at", nullable = false)
    private LocalDateTime joinedAt;

    @PrePersist
    public void prePersist() {
        if(status == null) {
            status = RoomStudentStatus.ACTIVE;
        }
        if(attemptNo == null) {
            attemptNo = 1;
        }
        if(joinedAt == null) {
            joinedAt = LocalDateTime.now();
        }
    }
}
