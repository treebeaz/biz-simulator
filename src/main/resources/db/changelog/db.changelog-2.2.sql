--liquibase formatted sql

--changeset karim:rooms-3-add-capacity-and-salary
ALTER TABLE room_rules
    ADD COLUMN cap0 INT NOT NULL DEFAULT 60,
    ADD COLUMN staff_slots INT NOT NULL DEFAULT 2,
    ADD COLUMN experienced_capacity INT NOT NULL DEFAULT 15,
    ADD COLUMN junior_capacity INT NOT NULL DEFAULT 5,
    ADD COLUMN experienced_salary_month NUMERIC(14,2) NOT NULL DEFAULT 70000.00,
    ADD COLUMN junior_salary_month NUMERIC(14,2) NOT NULL DEFAULT 35000.00;

--changeset karim:rooms-3-checks
ALTER TABLE room_rules
    ADD CONSTRAINT ck_room_rules_cap0 CHECK (cap0 >= 0),
    ADD CONSTRAINT ck_room_rules_staff_slots CHECK (staff_slots >= 0),
    ADD CONSTRAINT ck_room_rules_exp_capacity CHECK (experienced_capacity >= 0),
    ADD CONSTRAINT ck_room_rules_jun_capacity CHECK (junior_capacity >= 0),
    ADD CONSTRAINT ck_room_rules_exp_salary CHECK (experienced_salary_month >= 0),
    ADD CONSTRAINT ck_room_rules_jun_salary CHECK (junior_salary_month >= 0);