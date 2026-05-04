--liquibase formatted sql

--changeset karim:game-states-1
CREATE TABLE game_states
(
    id                  UUID PRIMARY KEY        DEFAULT gen_random_uuid(),
    room_participant_id UUID           NOT NULL UNIQUE,
    step                INT            NOT NULL DEFAULT 0,
    cash                DECIMAL(15, 2) NOT NULL,
    stock               INT            NOT NULL,
    staff               DECIMAL(5, 2)  NOT NULL,
    current_cost        DECIMAL(10, 2) NOT NULL,

    last_marketing      DECIMAL(15, 2) NOT NULL DEFAULT 0,

    created_at          TIMESTAMP               DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP               DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_game_state_participant FOREIGN KEY (room_participant_id) REFERENCES room_participants (id) ON DELETE CASCADE
);

--changeset karim:turn-history-1
CREATE TABLE turn_history
(
    id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_participant_id  UUID           NOT NULL,
    step                 INT            NOT NULL,

    price                DECIMAL(10, 2) NOT NULL, --p_t
    purchase_quantity    INT            NOT NULL, --q_t
    marketing_expense    DECIMAL(15, 2) NOT NULL, --m_t
    staff_change         DECIMAL(5, 2)  NOT NULL, --h_t

    demand               INT,                     --D_t
    sales                INT,                     --факт. продажи

    revenue              DECIMAL(15, 2),          --R_t
    salary_cost          DECIMAL(15, 2),          --w * L_t
    variable_cost        DECIMAL(15, 2),          --себестоимость проданного
    purchase_cost        DECIMAL(15, 2),          --c_t * q_t (закупка)
    total_cost           DECIMAL(15, 2),          --Z_t
    profit               DECIMAL(15, 2),          --П_t

    cash_after           DECIMAL(15, 2),
    stock_after          INT,
    staff_after          DECIMAL(5, 2),
    current_cost_after   DECIMAL(10, 2),
    last_marketing_after DECIMAL(15, 2),

    created_at           TIMESTAMP        DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_turn_history_participant FOREIGN KEY (room_participant_id) REFERENCES room_participants (id) ON DELETE CASCADE,

    CONSTRAINT uk_turn UNIQUE (room_participant_id, step)
);

CREATE INDEX idx_turn_history_participant ON turn_history (room_participant_id);