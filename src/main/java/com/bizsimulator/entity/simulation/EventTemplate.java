package com.bizsimulator.entity.simulation;

import com.bizsimulator.entity.enums.BusinessType;
import com.bizsimulator.entity.enums.EffectType;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "event_templates")
public class EventTemplate {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "name", nullable = false)
    private String name;

    @Column(name = "description", nullable = false)
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(name = "business_type", nullable = false)
    private BusinessType businessType;

    @Enumerated(EnumType.STRING)
    @Column(name = "effect_type", nullable = false)
    private EffectType effectType;

    @Column(name = "effect_value")
    private BigDecimal effectValue;

    @Column(name = "duration", nullable = false)
    private Integer duration;

    @Column(name = "probability_weight")
    private BigDecimal probabilityWeight;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    public void prePersist() {
        if (effectValue == null) {
            effectValue = BigDecimal.ONE;
        }
        if (duration == null) {
            duration = 0;
        }
        if (probabilityWeight == null) {
            probabilityWeight = BigDecimal.ONE;
        }
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }
}
