--liquibase formatted sql

--changeset karim:rooms-3
CREATE TABLE room_students
(
    id         UUID PRIMARY KEY     DEFAULT gen_random_uuid(),
    room_id    UUID        NOT NULL,
    student_id UUID        NOT NULL,
    status     VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
    attempt_no INT         NOT NULL DEFAULT 1,
    joined_at  TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_room_students_room FOREIGN KEY (room_id)
        REFERENCES rooms (id) ON DELETE CASCADE,

    CONSTRAINT fk_room_students_student FOREIGN KEY (student_id)
        REFERENCES users (id),

    CONSTRAINT uk_room_students_unique UNIQUE (room_id, student_id),

    CONSTRAINT ck_room_students_status CHECK ( status in ('ACTIVE', 'LEFT', 'REMOVED') ),

    CONSTRAINT ck_room_students_attempt_no CHECK ( attempt_no >= 1 )
);

--changeset karim:rooms-3-idx-1
CREATE INDEX idx_room_students_room_id ON room_students (room_id);

--changeset karim:rooms-3-idx-2
CREATE INDEX idx_room_students_student_id ON room_students (student_id);