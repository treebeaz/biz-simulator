package com.bizsimulator.entity.room;

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
@Table(name = "room_settings")
public class RoomSettings {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "room_id", nullable = false, unique = true)
    private UUID roomId;

    @Column(name = "start_cash", nullable = false)
    private BigDecimal startCash;

    @Column(name = "start_stock", nullable = false)
    private Integer startStock;

    @Column(name = "start_staff", nullable = false)
    private BigDecimal startStaff;

    @Column(name = "start_cost", nullable = false)
    private BigDecimal startCost;

    @Column(name = "base_demand", nullable = false)
    private Integer baseDemand;

    @Column(name = "avg_price", nullable = false)
    private BigDecimal avgPrice;

    @Column(name = "elasticity", nullable = false)
    private BigDecimal elasticity;

    @Column(name = "marketing_efficiency", nullable = false)
    private BigDecimal marketingEfficiency;

    @Column(name = "fixed_cost", nullable = false)
    private BigDecimal fixedCost;

    @Column(name = "salary_per_staff", nullable = false)
    private BigDecimal salaryPerStaff;

    @Column(name = "event_probability", nullable = false)
    private BigDecimal eventProbability;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    public void prePersist() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
            updatedAt = LocalDateTime.now();
        }
    }

    @PreUpdate
    public void preUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
