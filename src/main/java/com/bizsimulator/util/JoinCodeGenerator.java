package com.bizsimulator.util;

import com.bizsimulator.exception.CodeAlreadyExistsException;
import com.bizsimulator.exception.CodeGenerationException;
import com.bizsimulator.repository.GroupRepository;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.security.SecureRandom;

@RequiredArgsConstructor
@Slf4j
@Component
public class JoinCodeGenerator {
    private static final String ALPHABET_UPPER = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    private static final String ALPHABET_LOWER = "abcdefghijklmnopqrstuvwxyz";
    private static final String DIGITS = "0123456789";
    private static final String OTHER_SYMBOLS = "+-=/!#*&%$.";
    private static final int DEFAULT_LENGTH = 32;

    private static final String ALPHABET =  ALPHABET_UPPER + ALPHABET_LOWER +
                                            DIGITS + OTHER_SYMBOLS;

    private final GroupRepository groupRepository;
    private final SecureRandom random = new SecureRandom();

    public String generate() throws CodeGenerationException {
        String generatedCode;
        int attempt = 0;

        do {
            generatedCode = generateCode();
            attempt++;
            if(attempt > 10) {
                log.error("JoinCodeGenerator.generate.warn.TooManyAttemptsToGenerateUniqueCode");
                throw new CodeGenerationException("JoinCodeGenerator.generate.error: Too many attempts to generate unique code");
            }
        } while (groupRepository.existsByJoinCode(generatedCode));

        return generatedCode;
    }

    private String generateCode() {
        StringBuilder sb = new StringBuilder(DEFAULT_LENGTH);
        for (int i = 0; i < DEFAULT_LENGTH; i++) {
            int index = random.nextInt(ALPHABET.length());
            sb.append(ALPHABET.charAt(index));
        }

        return sb.toString();
    }

}
