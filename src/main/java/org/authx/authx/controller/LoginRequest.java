package org.authx.authx.controller;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record LoginRequest(

    @Email
    @NotBlank
    String email,

    @NotBlank
    String password
)
{}
