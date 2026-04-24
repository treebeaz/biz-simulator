--liquibase formatted sql

--changeset karim:sim-1
CREATE TABLE room_runtime
(
    room_id          UUID PRIMARY KEY,
    current_day      INT       NOT NULL DEFAULT 1,
    is_running       BOOLEAN   NOT NULL DEFAULT FALSE,
    speed_multiplier INT       NOT NULL DEFAULT 1,
    last_tick_at     TIMESTAMP,
    started_at       TIMESTAMP,
    finished_at      TIMESTAMP,
    updated_at       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_room_runtime_room FOREIGN KEY (room_id) REFERENCES rooms (id) ON DELETE CASCADE,
    CONSTRAINT ck_room_runtime_speed CHECK ( speed_multiplier IN (1, 2, 4) )
);

--changeset karim:sim-2
CREATE TABLE room_student_state
(
    id                UUID PRIMARY KEY        DEFAULT gen_random_uuid(),
    room_id           UUID           NOT NULL,
    student_id        UUID           NOT NULL,
    cash              NUMERIC(19, 2) NOT NULL,
    stock_units       INT            NOT NULL DEFAULT 0,
    price             NUMERIC(19, 2) NOT NULL,
    marketing_budget  NUMERIC(19, 2) NOT NULL DEFAULT 0,
    junior_count      INT            NOT NULL DEFAULT 0,
    experienced_count INT            NOT NULL DEFAULT 0,
    cumulative_profit NUMERIC(19, 2) NOT NULL DEFAULT 0,
    is_bankrupt       BOOLEAN        NOT NULL DEFAULT FALSE,
    updated_at        TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_room_student_state_room FOREIGN KEY (room_id) REFERENCES rooms (id) ON DELETE CASCADE,
    CONSTRAINT fk_room_student_state_student FOREIGN KEY (student_id) REFERENCES users (id),
    CONSTRAINT uk_room_student_state UNIQUE (room_id, student_id),
    CONSTRAINT ck_room_student_state_stock CHECK (stock_units >= 0)
);

--changeset karim:sim-3
CREATE TABLE room_student_decision
(
    id               UUID PRIMARY KEY   DEFAULT gen_random_uuid(),
    room_id          UUID      NOT NULL,
    student_id       UUID      NOT NULL,
    day_no           INT       NOT NULL,
    price            NUMERIC(19, 2),
    purchase_units   INT,
    marketing_budget NUMERIC(19, 2),
    hire_junior      INT,
    fire_junior      INT,
    hire_experienced INT,
    fire_experienced INT,
    created_at       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_room_student_decision_room FOREIGN KEY (room_id) REFERENCES rooms (id) ON DELETE CASCADE,
    CONSTRAINT fk_room_student_decision_student FOREIGN KEY (student_id) REFERENCES users (id),
    CONSTRAINT uk_room_student_decision UNIQUE (room_id, student_id, day_no)
);

--changeset karim:sim-4
CREATE TABLE room_student_day_result
(
    id              UUID PRIMARY KEY        DEFAULT gen_random_uuid(),
    room_id         UUID           NOT NULL,
    student_id      UUID           NOT NULL,
    day_no          INT            NOT NULL,
    demand_units    INT            NOT NULL,
    sold_units      INT            NOT NULL,
    revenue         NUMERIC(19, 2) NOT NULL,
    expenses        NUMERIC(19, 2) NOT NULL,
    day_profit      NUMERIC(19, 2) NOT NULL,
    end_cash        NUMERIC(19, 2) NOT NULL,
    end_stock_units INT            NOT NULL,
    created_at      TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_room_student_day_result_room FOREIGN KEY (room_id) REFERENCES rooms (id) ON DELETE CASCADE,
    CONSTRAINT fk_room_student_day_result_student FOREIGN KEY (student_id) REFERENCES users (id),
    CONSTRAINT uk_room_student_day_result UNIQUE (room_id, student_id, day_no)
);