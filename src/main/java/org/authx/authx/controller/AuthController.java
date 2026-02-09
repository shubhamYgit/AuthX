package org.authx.authx.controller;


import org.authx.authx.security.JwtService;
import org.authx.authx.user.*;
import org.springframework.http.HttpStatus;
import org.springframework.http.RequestEntity;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.HttpClientErrorException;

@RestController
@RequestMapping("/auth")
@Validated
public class AuthController {
    private final LoginService loginService;
    private final JwtService jwtService;
    private final SignupService signupService;

    public AuthController(LoginService loginService , JwtService jwtService, SignupService signupService){
        this.loginService=loginService;
        this.jwtService=jwtService;
        this.signupService = signupService;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody @Validated LoginRequest loginRequest){

        try {
            User user = loginService.authenticate(loginRequest.email(), loginRequest.password());
             String token= jwtService.generateToken(user);

             return ResponseEntity.ok(new LoginResponse(token,jwtService.getExpirationSeconds(),
                     user.getRole()));
        }
        catch(InvalidCredentialsException ex){
           return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
    }

    @GetMapping("/admin/test")
    @PreAuthorize("hasRole('ADMIN')")
    public String adminTest(){
        return "ADMIN OK";
    }

    @PostMapping("/signup")
    public ResponseEntity<?> signup(@RequestBody @Validated SignupRequest request) {

        try {
            signupService.signup(request.email(), request.password());
            return ResponseEntity.status(HttpStatus.CREATED).build();
        }
        catch (EmailAlreadyExistsException ex) {
            return ResponseEntity.status(HttpStatus.CONFLICT).build();
        }
    }

}
