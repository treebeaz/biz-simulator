package com.bizsimulator.entity.sim;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "room_student_state",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_room_student_state", columnNames = {"room_id", "student_id"})
        })
public class RoomStudentState {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "room_id", nullable = false)
    private UUID roomId;

    @Column(name = "student_id", nullable = false)
    private UUID studentId;

    @Column(name = "cash", nullable = false)
    private BigDecimal cash;

    @Column(name = "stock_units", nullable = false)
    private Integer stockUnits;

    @Column(name = "price", nullable = false)
    private BigDecimal price;

    @Column(name = "marketing_budget", nullable = false)
    private BigDecimal marketingBudget;

    @Column(name = "junior_count", nullable = false)
    private Integer juniorCount;

    @Column(name = "experienced_count", nullable = false)
    private Integer experiencedCount;

    @Column(name = "cumulative_profit", nullable = false)
    private BigDecimal cumulativeProfit;

    @Column(name = "is_bankrupt", nullable = false)
    private Boolean isBankrupt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    public void prePersist() {
        if (stockUnits == null) {
            stockUnits = 0;
        }
        if (marketingBudget == null) {
            marketingBudget = BigDecimal.ZERO;
        }
        if (juniorCount == null) {
            juniorCount = 0;
        }
        if (experiencedCount == null) {
            experiencedCount = 0;
        }
        if (cumulativeProfit == null) {
            cumulativeProfit = BigDecimal.ZERO;
        }
        if (isBankrupt == null) {
            isBankrupt = false;
        }
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    public void preUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
