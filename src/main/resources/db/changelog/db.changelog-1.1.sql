--liquibase formatted sql

--changeset karim:1
CREATE TABLE groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL UNIQUE,
    join_code VARCHAR(32) NOT NULL UNIQUE,
    teacher_id UUID NOT NULL,
    created_id TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_id TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_groups_teacher_id FOREIGN KEY (teacher_id) REFERENCES users(id)
);

--changeset karim:2
CREATE TABLE group_students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL UNIQUE,
    student_id UUID NOT NULL UNIQUE,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_group_students_group FOREIGN KEY (group_id) REFERENCES groups(id),
    CONSTRAINT fk_group_students_student FOREIGN KEY (student_id) REFERENCES users(id)

);

--changeset karim:3
ALTER TABLE groups RENAME COLUMN created_id TO created_at;
ALTER TABLE groups RENAME COLUMN updated_id TO updated_at;

--changeset karim:4
ALTER TABLE group_students
    DROP CONSTRAINT IF EXISTS group_students_group_id_key,
    DROP CONSTRAINT IF EXISTS group_students_student_id_key;

ALTER TABLE group_students
    ADD CONSTRAINT uk_group_student_unique
        UNIQUE (group_id, student_id);