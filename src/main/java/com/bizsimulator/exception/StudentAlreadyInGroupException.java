package com.bizsimulator.exception;

public class StudentAlreadyInGroupException extends RuntimeException {
    public StudentAlreadyInGroupException(String message) {
        super(message);
    }
}
