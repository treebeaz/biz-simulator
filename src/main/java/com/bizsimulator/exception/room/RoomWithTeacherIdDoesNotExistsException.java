package com.bizsimulator.exception.room;

public class RoomWithTeacherIdDoesNotExistsException extends RuntimeException {
    public RoomWithTeacherIdDoesNotExistsException(String message) {
        super(message);
    }
}
