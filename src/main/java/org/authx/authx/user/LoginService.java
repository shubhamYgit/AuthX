package org.authx.authx.user;


import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class LoginService {

    private UserRepository userRepository;
    private PasswordEncoder passwordEncoder;

    public LoginService(UserRepository userRepository , PasswordEncoder passwordEncoder){
        this.userRepository=userRepository;
        this.passwordEncoder=passwordEncoder;


    }

    public User authenticate(String email,String rawPassword){

        String normalizedEmail=email.trim().toLowerCase();

        User user=userRepository.findByEmail(normalizedEmail).orElseThrow(()->new
                InvalidCredentialsException());

        if(!user.isEnabled()){
            throw new InvalidCredentialsException();
        }

        if(!passwordEncoder.matches(rawPassword, user.getPasswordHash())){
            throw new InvalidCredentialsException();
        }

        return user;
    }
}
