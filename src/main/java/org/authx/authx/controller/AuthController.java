package org.authx.authx.controller;


import org.authx.authx.user.InvalidCredentialsException;
import org.authx.authx.user.LoginService;
import org.authx.authx.user.User;
import org.springframework.http.HttpStatus;
import org.springframework.http.RequestEntity;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.HttpClientErrorException;

@RestController
@RequestMapping("/auth")
@Validated
public class AuthController {
    private final LoginService loginService;

    public AuthController(LoginService loginService){
        this.loginService=loginService;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody @Validated LoginRequest loginRequest){

        try {
            User user = loginService.authenticate(loginRequest.email(), loginRequest.password());
            return ResponseEntity.ok().build();
        }
        catch(InvalidCredentialsException ex){
           return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
    }
}
