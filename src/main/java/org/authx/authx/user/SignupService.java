package org.authx.authx.user;


import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.Instant;

@Service
public class SignupService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public SignupService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public void signup(String email, String rawPassword){
        if(userRepository.existsByEmail(email)){
            throw new EmailAlreadyExistsException();
        }

        User user=new User(
                null,
                email,
                passwordEncoder.encode(rawPassword),
                true,
                Instant.now(),
                "ROLE_USER"
        );
        userRepository.save(user);
    }
}
