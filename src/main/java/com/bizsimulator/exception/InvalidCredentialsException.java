package com.bizsimulator.exception;

public class InvalidCredentialsException extends RuntimeException {
    public InvalidCredentialsException(String invalidUsernameOrPassword) {
        super(invalidUsernameOrPassword);
    }
}
