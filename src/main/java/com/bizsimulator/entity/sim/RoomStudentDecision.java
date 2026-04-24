package com.bizsimulator.entity.sim;

import io.swagger.v3.oas.annotations.media.Schema;
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
@Table(name = "room_student_decision", uniqueConstraints = {
        @UniqueConstraint(name = "uk_room_student_decision", columnNames =
                {
                        "room_id", "student_id", "day_no"
                })
})
public class RoomStudentDecision {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "room_id", nullable = false)
    private UUID roomId;

    @Column(name = "student_id", nullable = false)
    private UUID studentId;

    @Column(name = "day_no", nullable = false)
    private Integer dayNo;

    @Column(name = "price")
    private BigDecimal price;

    @Column(name = "purchase_units")
    private Integer purchaseUnits;

    @Column(name = "marketing_budget")
    private BigDecimal marketingBudget;

    @Column(name = "hire_junior")
    private Integer hireJunior;

    @Column(name = "fire_junior")
    private Integer fireJunior;

    @Column(name = "hire_experienced")
    private Integer hireExperienced;

    @Column(name = "fire_experienced")
    private Integer fireExperienced;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    public void prePersist() {
        if (purchaseUnits == null) {
            purchaseUnits = 0;
        }
        if (hireJunior == null) {
            hireJunior = 0;
        }
        if (fireJunior == null) {
            fireJunior = 0;
        }
        if (hireExperienced == null) {
            hireExperienced = 0;
        }
        if (fireExperienced == null) {
            fireExperienced = 0;
        }
        if (marketingBudget == null) {
            marketingBudget = BigDecimal.ZERO;
        }
        createdAt = LocalDateTime.now();
    }
}
