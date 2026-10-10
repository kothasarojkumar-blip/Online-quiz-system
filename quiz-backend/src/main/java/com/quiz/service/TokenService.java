package com.quiz.service;

import com.quiz.model.User;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Base64;

@Service
public class TokenService {

    // Internal HMAC secret key for signing tokens
    private static final String SECRET = "OnlineQuizSystemSecretKeyForJWTAuth2026!@#$%^";
    private static final long EXPIRATION_MS = 24 * 60 * 60 * 1000; // 24 hours

    public String generateToken(User user) {
        long expiry = System.currentTimeMillis() + EXPIRATION_MS;
        String payload = user.getId() + ":" + user.getEmail() + ":" + user.getRole() + ":" + expiry;
        String encodedPayload = Base64.getUrlEncoder().withoutPadding().encodeToString(payload.getBytes(StandardCharsets.UTF_8));
        String signature = sign(encodedPayload);
        return encodedPayload + "." + signature;
    }

    public boolean validateToken(String token) {
        if (token == null || !token.contains(".")) {
            return false;
        }
        try {
            String[] parts = token.split("\\.");
            if (parts.length != 2) return false;

            String encodedPayload = parts[0];
            String expectedSig = sign(encodedPayload);

            if (!MessageDigest.isEqual(expectedSig.getBytes(StandardCharsets.UTF_8), parts[1].getBytes(StandardCharsets.UTF_8))) {
                return false;
            }

            String payload = new String(Base64.getUrlDecoder().decode(encodedPayload), StandardCharsets.UTF_8);
            String[] data = payload.split(":");
            if (data.length < 4) return false;

            long expiry = Long.parseLong(data[3]);
            return System.currentTimeMillis() < expiry;
        } catch (Exception e) {
            return false;
        }
    }

    public String getEmailFromToken(String token) {
        try {
            String encodedPayload = token.split("\\.")[0];
            String payload = new String(Base64.getUrlDecoder().decode(encodedPayload), StandardCharsets.UTF_8);
            return payload.split(":")[1];
        } catch (Exception e) {
            return null;
        }
    }

    public String getRoleFromToken(String token) {
        try {
            String encodedPayload = token.split("\\.")[0];
            String payload = new String(Base64.getUrlDecoder().decode(encodedPayload), StandardCharsets.UTF_8);
            return payload.split(":")[2];
        } catch (Exception e) {
            return null;
        }
    }

    private String sign(String data) {
        try {
            Mac hmac = Mac.getInstance("HmacSHA256");
            SecretKeySpec secretKey = new SecretKeySpec(SECRET.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
            hmac.init(secretKey);
            byte[] hash = hmac.doFinal(data.getBytes(StandardCharsets.UTF_8));
            return Base64.getUrlEncoder().withoutPadding().encodeToString(hash);
        } catch (Exception e) {
            throw new RuntimeException("Error signing token", e);
        }
    }
}
