package org.authx.authx.controller;

import java.time.Instant;

public record LoginResponse(
        String accessToken,
//        String refreshToken,
        long expiresIn,
        String role

) {}
