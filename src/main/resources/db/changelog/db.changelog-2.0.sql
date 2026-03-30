--liquibase formatted sql

--changeset karim:rooms-1
CREATE TABLE rooms
(
    id                   UUID PRIMARY KEY        DEFAULT gen_random_uuid(),
    teacher_id           UUID           NOT NULL,
    group_id             UUID           NOT NULL,

    room_name            VARCHAR(255)   NOT NULL,
    business_type        VARCHAR(100)   NOT NULL,
    status               VARCHAR(30)    NOT NULL,
    initial_budget       NUMERIC(14, 2) NOT NULl,

    start_day            INT            NOT NULL DEFAULT 1,
    end_day              INT            NOT NULL DEFAULT 30,
    day_duration_seconds INT            NOT NULL DEFAULT 30,

    created_at           TIMESTAMP               DEFAULT CURRENT_TIMESTAMP,
    updated_at           TIMESTAMP               DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_rooms_teacher_id FOREIGN KEY (teacher_id) REFERENCES users (id),
    CONSTRAINT fk_rooms_group_id FOREIGN KEY (group_id) REFERENCES groups (id)
);

--changeset karim:rooms-2
CREATE TABLE room_rules
(
    room_id               UUID PRIMARY KEY,

    rent_percent          NUMERIC(5, 4) NOT NULL DEFAULT 0.3000,
    marketing_ref_percent NUMERIC(5, 4) NOT NULL DEFAULT 0.0200,
    noise_min             NUMERIC(5, 4) NOT NULL DEFAULT 0.8500,
    noise_max             NUMERIC(5, 4) NOT NULL DEFAULT 1.1500,

    CONSTRAINT fk_room_rules_room FOREIGN KEY (room_id) REFERENCES rooms (id) ON DELETE CASCADE
);
