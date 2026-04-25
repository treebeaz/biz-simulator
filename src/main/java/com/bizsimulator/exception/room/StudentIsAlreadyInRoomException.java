package com.bizsimulator.exception.room;

public class StudentIsAlreadyInRoomException extends RuntimeException {
    public StudentIsAlreadyInRoomException(String message) {
        super(message);
    }
}
