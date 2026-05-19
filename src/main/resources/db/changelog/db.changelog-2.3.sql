--liquibase formatted sql

--changeset karim:event-templates-1
CREATE TABLE event_templates
(
    id                 UUID PRIMARY KEY        DEFAULT gen_random_uuid(),
    name               VARCHAR(255)   NOT NULL,
    description        TEXT           NOT NULL,
    business_type      VARCHAR(50)    NOT NULL,
    effect_type        VARCHAR(50)    NOT NULL,
    effect_value       DECIMAL(15, 2) NOT NULL,
    duration           INT            NOT NULL DEFAULT 0,
    probability_weight DECIMAL(5, 2)           DEFAULT 1.0,
    created_at         TIMESTAMP               DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE active_events
(
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_participant_id UUID NOT NULL,
    event_template_id   UUID NOT NULL,
    remaining_steps     INT  NOT NULL,
    multiplier_staff    DECIMAL(5, 2)    DEFAULT 1.0,
    multiplier_cost     DECIMAL(10, 2)   DEFAULT 1.0,
    multiplier_demand   DECIMAL(10, 2)   DEFAULT 1.0,
    created_at          TIMESTAMP        DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP        DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_active_events_participant FOREIGN KEY (room_participant_id)
        REFERENCES room_participants (id) ON DELETE CASCADE,

    CONSTRAINT fk_active_events_event_templates FOREIGN KEY (event_template_id)
        REFERENCES event_templates (id)
);

CREATE INDEX idx_active_events_participant ON active_events (room_participant_id);

-- changeset karim:seed-events-coffee-shop
INSERT INTO event_templates (id, name, description, business_type, effect_type, effect_value, duration, probability_weight)
VALUES
    (gen_random_uuid(), 'Поломка кофемашины', 'Сломалась кофемашина. Требуется срочный ремонт.', 'COFFEE_SHOP', 'INSTANT_CASH', -7000, 0, 1.0),
    (gen_random_uuid(), 'Бариста заболел', 'Ключевой бариста заболел. Эффективность персонала снижена.', 'COFFEE_SHOP', 'STAFF_MULTIPLIER', 0.8, 3, 1.0),
    (gen_random_uuid(), 'Цены на зёрна выросли', 'Поставщик поднял цены на кофейные зёрна.', 'COFFEE_SHOP', 'COST_MULTIPLIER', 1.2, 4, 1.0),
    (gen_random_uuid(), 'Городской фестиваль', 'В городе проходит фестиваль. Спрос на кофе вырос.', 'COFFEE_SHOP', 'DEMAND_MULTIPLIER', 1.5, 2, 1.0),
    (gen_random_uuid(), 'Хайп в соцсетях', 'Вашу кофейню расхвалил популярный блогер. Бесплатный пиар.', 'COFFEE_SHOP', 'DEMAND_MULTIPLIER', 1.4, 1, 1.0),
    (gen_random_uuid(), 'Скидка от поставщика', 'Поставщик предоставил одномесячную скидку на ингредиенты.', 'COFFEE_SHOP', 'COST_MULTIPLIER', 0.85, 5, 0.8);