package org.authx.authx.controller;

public record LoginResponse(
        String accessToken,
        long expiresIn,
        String role
) {}
