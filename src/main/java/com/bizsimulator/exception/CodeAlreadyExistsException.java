package com.bizsimulator.exception;

public class CodeAlreadyExistsException extends RuntimeException {
    public CodeAlreadyExistsException(String message) {
        super(message);
    }
}
