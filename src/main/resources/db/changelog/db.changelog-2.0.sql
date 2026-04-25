--liquibase formatted sql

--changeset karim:create-room-1
CREATE TABLE room
(
    id            UUID PRIMARY KEY      DEFAULT gen_random_uuid(),
    teacher_id    UUID         NOT NULL,

    name          VARCHAR(255) NOT NULL,
    business_type VARCHAR(100) NOT NULL,
    status        VARCHAR(30)  NOT NULL DEFAULT 'DRAFT',
    max_turns     INT          NOT NULL DEFAULT 30,
    join_code     VARCHAR(32)  NOT NULL UNIQUE,

    created_at    TIMESTAMP             DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP             DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_room_teacher_id FOREIGN KEY (teacher_id) REFERENCES users (id)
);

--changeset karim:create-room--2
CREATE TABLE room_participants
(
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    room_id UUID NOT NULL,
    user_id UUID NOT NULL,

    current_step INT NOT NULL DEFAULT 0,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_room_participants_room FOREIGN KEY (room_id) REFERENCES room(id),
    CONSTRAINT fk_room_participants_user FOREIGN KEY (user_id) REFERENCES users(id),

    CONSTRAINT uk_room_user UNIQUE(room_id, user_id)
);