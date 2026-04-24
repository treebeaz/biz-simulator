package com.bizsimulator.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Column;
import jakarta.persistence.OneToOne;
import jakarta.persistence.MapsId;
import jakarta.persistence.JoinColumn;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;

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
    private BigDecimal marketingRefPercent = new BigDecimal("0.02");

    @Builder.Default
    @Column(name = "noise_min", nullable = false)
    private BigDecimal noiseMin = new BigDecimal("0.85");

    @Builder.Default
    @Column(name = "noise_max", nullable = false)
    private BigDecimal noiseMax = new BigDecimal("1.15");

    @Builder.Default
    @Column(name = "cap0", nullable = false)
    private Integer cap0 = 60;

    @Builder.Default
    @Column(name = "staff_slots", nullable = false)
    private Integer staffSlots = 2;

    @Builder.Default
    @Column(name = "experienced_capacity", nullable = false)
    private Integer experiencedCapacity = 15;

    @Builder.Default
    @Column(name = "junior_capacity", nullable = false)
    private Integer juniorCapacity = 5;

    @Builder.Default
    @Column(name = "experienced_salary_month", nullable = false)
    private BigDecimal experiencedSalaryMonth = new BigDecimal("70000.00");

    @Builder.Default
    @Column(name = "junior_salary_month", nullable = false)
    private BigDecimal juniorSalaryMonth = new BigDecimal("35000.00");
}
