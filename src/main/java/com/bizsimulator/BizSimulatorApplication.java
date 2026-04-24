package com.bizsimulator;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class BizSimulatorApplication {
    public static void main(String[] args) {
        SpringApplication.run(BizSimulatorApplication.class, args);
    }
}
