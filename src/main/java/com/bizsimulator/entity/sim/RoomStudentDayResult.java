package com.bizsimulator.entity.sim;

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
@Table(name = "room_student_day_result",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_room_student_day_result",
                        columnNames = {
                                "room_id", "student_id", "day_no"
                        })
        })
public class RoomStudentDayResult {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "room_id", nullable = false)
    private UUID roomId;

    @Column(name = "student_id", nullable = false)
    private UUID studentId;

    @Column(name = "day_no", nullable = false)
    private Integer dayNo;

    @Column(name = "demand_units", nullable = false)
    private Integer demandUnits;

    @Column(name = "sold_units", nullable = false)
    private Integer soldUnits;

    @Column(name = "revenue", nullable = false)
    private BigDecimal revenue;

    @Column(name = "expenses", nullable = false)
    private BigDecimal expenses;

    @Column(name = "day_profit", nullable = false)
    private BigDecimal dayProfit;

    @Column(name = "end_cash", nullable = false)
    private BigDecimal endCash;

    @Column(name = "end_stock_units", nullable = false)
    private Integer endStockUnits;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    void prePersist() {
        createdAt = LocalDateTime.now();
    }
}
