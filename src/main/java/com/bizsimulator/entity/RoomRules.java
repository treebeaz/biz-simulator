package com.bizsimulator.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.util.UUID;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
@Entity
@Table(name = "room_rules")
public class RoomRules {
    @Id
    @Column(name = "room_id")
    private UUID roomId;

    @OneToOne(fetch = FetchType.LAZY)
    @MapsId
    @JoinColumn(name = "room_id")
    private Room room;

    @Column(name = "rent_percent", nullable = false)
    private BigDecimal rentPercent;

    @Column(name = "marketing_ref_percent", nullable = false)
    private BigDecimal marketingRefPercent;

    @Column(name = "noise_min", nullable = false)
    private BigDecimal noiseMin;

    @Column(name = "noise_max", nullable = false)
    private BigDecimal noiseMax;
}
