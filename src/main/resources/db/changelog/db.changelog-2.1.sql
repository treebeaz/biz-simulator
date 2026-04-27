--liquibase formatted sql

--changeset karim:create-room-settings
CREATE TABLE room_settings
(
    id                   UUID PRIMARY KEY        DEFAULT gen_random_uuid(),
    room_id              UUID           NOT NULL UNIQUE,

    -- начальное состояние
    start_cash           DECIMAL(15, 2) NOT NULL,
    start_stock          INT            NOT NULL,
    start_staff          DECIMAL(5, 2)  NOT NULL,
    start_cost           DECIMAL(10, 2) NOT NULL,

    -- спрос
    base_demand          INT            NOT NULL,
    avg_price            DECIMAL(10, 2) NOT NULL,
    elasticity           DECIMAL(5, 2)  NOT NULL,
    marketing_efficiency DECIMAL(5, 2)  NOT NULL,

    -- финансы
    fixed_cost           DECIMAL(15, 2) NOT NULL,
    salary_per_staff     DECIMAL(10, 2) NOT NULL,

    -- события
    event_probability    DECIMAL(3, 2)  NOT NULL DEFAULT 0.2,

    created_at           TIMESTAMP               DEFAULT CURRENT_TIMESTAMP,
    updated_at           TIMESTAMP               DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_room_settings_room FOREIGN KEY (room_id) REFERENCES room (id) ON DELETE CASCADE
);