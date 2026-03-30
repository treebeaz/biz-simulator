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

    @Builder.Default
    @Column(name = "rent_percent", nullable = false)
    private BigDecimal rentPercent = new BigDecimal("0.30");

    @Builder.Default
    @Column(name = "marketing_ref_percent", nullable = false)
    private BigDecimal marketingRefPercent =  new BigDecimal("0.02");

    @Builder.Default
    @Column(name = "noise_min", nullable = false)
    private BigDecimal noiseMin = new BigDecimal("0.85");

    @Builder.Default
    @Column(name = "noise_max", nullable = false)
    private BigDecimal noiseMax = new BigDecimal("1.15");
}
