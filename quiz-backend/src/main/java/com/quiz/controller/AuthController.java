package com.quiz.controller;

import com.quiz.model.User;
import com.quiz.repository.UserRepository;
import com.quiz.service.TokenService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private TokenService tokenService;

    @PostMapping("/register")
    public ResponseEntity<Map<String, Object>> register(@RequestBody Map<String, String> req) {
        Map<String, Object> res = new HashMap<>();

        String username = req.get("username");
        String email = req.get("email");
        String password = req.get("password");

        if (username == null || username.isBlank() || email == null || email.isBlank() || password == null || password.isBlank()) {
            res.put("error", "Username, email, and password are required.");
            return ResponseEntity.badRequest().body(res);
        }
        if (!email.matches("^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$")) {
            res.put("error", "Invalid email format.");
            return ResponseEntity.badRequest().body(res);
        }
        if (password.length() < 6) {
            res.put("error", "Password must be at least 6 characters.");
            return ResponseEntity.badRequest().body(res);
        }
        if (userRepository.existsByEmail(email)) {
            res.put("error", "An account with this email already exists.");
            return ResponseEntity.badRequest().body(res);
        }
        if (userRepository.existsByUsername(username)) {
            res.put("error", "This username is already taken.");
            return ResponseEntity.badRequest().body(res);
        }

        User user = new User(username, email, passwordEncoder.encode(password), "ROLE_USER");
        userRepository.save(user);

        String token = tokenService.generateToken(user);

        res.put("message", "Registration successful!");
        res.put("token", token);
        res.put("user", Map.of("id", user.getId(), "username", user.getUsername(), "email", user.getEmail(), "role", user.getRole()));
        return ResponseEntity.ok(res);
    }

    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> login(@RequestBody Map<String, String> req) {
        Map<String, Object> res = new HashMap<>();

        String email = req.get("email");
        String password = req.get("password");

        if (email == null || email.isBlank() || password == null || password.isBlank()) {
            res.put("error", "Email and password are required.");
            return ResponseEntity.badRequest().body(res);
        }

        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isEmpty() || !passwordEncoder.matches(password, userOpt.get().getPassword())) {
            res.put("error", "Invalid email or password.");
            return ResponseEntity.status(401).body(res);
        }

        User user = userOpt.get();
        String token = tokenService.generateToken(user);

        res.put("token", token);
        res.put("user", Map.of("id", user.getId(), "username", user.getUsername(), "email", user.getEmail(), "role", user.getRole()));
        return ResponseEntity.ok(res);
    }

    @GetMapping("/me")
    public ResponseEntity<Map<String, Object>> me(@RequestHeader(value = "Authorization", required = false) String authHeader) {
        Map<String, Object> res = new HashMap<>();
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            res.put("error", "Not authenticated.");
            return ResponseEntity.status(401).body(res);
        }
        String token = authHeader.substring(7);
        if (!tokenService.validateToken(token)) {
            res.put("error", "Token expired or invalid.");
            return ResponseEntity.status(401).body(res);
        }
        String email = tokenService.getEmailFromToken(token);
        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isEmpty()) {
            res.put("error", "User not found.");
            return ResponseEntity.status(404).body(res);
        }
        User user = userOpt.get();
        res.put("user", Map.of("id", user.getId(), "username", user.getUsername(), "email", user.getEmail(), "role", user.getRole()));
        return ResponseEntity.ok(res);
    }
}
