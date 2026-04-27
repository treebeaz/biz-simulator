package com.bizsimulator.exception.room;

public class RoomSettingsNotFoundException extends RuntimeException {
    public RoomSettingsNotFoundException(String message) {
        super(message);
    }
}
