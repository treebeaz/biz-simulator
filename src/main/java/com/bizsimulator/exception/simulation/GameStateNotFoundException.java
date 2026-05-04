package com.bizsimulator.exception.simulation;

public class GameStateNotFoundException extends RuntimeException {
    public GameStateNotFoundException(String message) {
        super(message);
    }
}
