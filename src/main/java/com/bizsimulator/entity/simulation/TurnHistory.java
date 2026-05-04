package com.bizsimulator.entity.simulation;

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
@Table(name = "turn_history", uniqueConstraints = {
        @UniqueConstraint(columnNames = {
                "room_participant_id", "step"
        })
})
public class TurnHistory {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "room_participant_id", nullable = false)
    private UUID roomParticipantId;

    @Column(name = "step", nullable = false)
    private Integer step;

    @Column(name = "price", nullable = false)
    private BigDecimal price;

    @Column(name = "purchase_quantity", nullable = false)
    private Integer purchaseQuantity;

    @Column(name = "marketing_expense", nullable = false)
    private BigDecimal marketingExpense;

    @Column(name = "staff_change", nullable = false)
    private BigDecimal staffChange;

    @Column(name = "demand")
    private Integer demand;

    @Column(name = "sales")
    private Integer sales;

    @Column(name = "revenue")
    private BigDecimal revenue;

    @Column(name = "salary_cost")
    private BigDecimal salaryCost;

    @Column(name = "variable_cost")
    private BigDecimal variableCost;

    @Column(name = "purchase_cost")
    private BigDecimal purchaseCost;

    @Column(name = "total_cost")
    private BigDecimal totalCost;

    @Column(name = "profit")
    private BigDecimal profit;

    @Column(name = "cash_after")
    private BigDecimal cashAfter;

    @Column(name = "stock_after")
    private Integer stockAfter;

    @Column(name = "staff_after")
    private BigDecimal staffAfter;

    @Column(name = "current_cost_after")
    private BigDecimal currentCostAfter;

    @Column(name = "last_marketing_after")
    private BigDecimal lastMarketingAfter;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    public void prePersist() {
        createdAt = LocalDateTime.now();
    }
}
