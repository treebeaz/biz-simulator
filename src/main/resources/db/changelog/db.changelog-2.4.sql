--liquibase formatted sql

--changeset karim:student-grades-1
CREATE TABLE student_grades
(
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id     UUID NOT NULL,
    teacher_id  UUID NOT NULL,
    student_id  UUID NOT NULL,

    grade_value INT,
    comment     VARCHAR(500),

    created_at  TIMESTAMP        DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP        DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uk_student_grade UNIQUE (room_id, student_id),
    CONSTRAINT fk_student_grade_room FOREIGN KEY (room_id) REFERENCES room (id) ON DELETE CASCADE,
    CONSTRAINT fk_student_grade_teacher FOREIGN KEY (teacher_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_student_grade_student FOREIGN KEY (student_id) REFERENCES users (id) ON DELETE CASCADE


);