package com.bizsimulator.util;

import com.bizsimulator.entity.User;
import com.bizsimulator.entity.UserProfile;
import com.bizsimulator.repository.UserProfileRepository;
import com.bizsimulator.service.UserService;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

@RequiredArgsConstructor
@Component
@Slf4j
public class JwtUtil {

    @Value("${token.jwt.secret}")
    private String key;

    @Value("${token.jwt.expiration}")
    private Long expiration;

    private final UserProfileRepository userProfileRepository;

    public String generateToken(User user) {
        log.info("JwtUtil.generateToken.generatingJwtTokenForUser: {}", user.getUsername());
        UserProfile userProfile = userProfileRepository.findByUserId(user.getId());
        return createToken(user, userProfile);
    }

    private String createToken(User user, UserProfile userProfile) {
        return Jwts.builder()
                .subject(user.getUsername())
                .claim("id", user.getId())
                .claim("firstname", userProfile.getFirstName())
                .claim("lastname", userProfile.getLastName())
                .claim("role", user.getRole())
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + expiration))
                .signWith(getKey())
                .compact();
    }

    public boolean validateToken(String token) {
        try{
            Jwts.parser()
                    .verifyWith(getKey())
                    .build()
                    .parseSignedClaims(token);
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    public String extractUsername(String token) {
        return Jwts.parser()
                .verifyWith(getKey())
                .build()
                .parseSignedClaims(token)
                .getPayload()
                .getSubject();
    }

    private SecretKey getKey() {
        return Keys.hmacShaKeyFor(key.getBytes(StandardCharsets.UTF_8));
    }
}
