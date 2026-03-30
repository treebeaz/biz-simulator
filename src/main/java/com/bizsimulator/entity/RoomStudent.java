package com.bizsimulator.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

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
}
