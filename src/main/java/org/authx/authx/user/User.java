package org.authx.authx.user;


import jakarta.persistence.*;

import java.time.Instant;

@Entity
@Table(name = "users",uniqueConstraints = {
        @UniqueConstraint(columnNames = "email")
})
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false , length=255)
    private String email;

    @Column(name = "password_hash" , nullable = false,length = 255)
    private String passwordHash;

    @Column(nullable = false)
    private boolean enabled;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name="roles" , nullable = false , length = 50)
    private String role;

    protected User(){}

    public User(Long id,String email, String passwordHash, boolean enabled, Instant createdAt,String role) {
        this.id = id;
        this.email = email;
        this.passwordHash = passwordHash;
        this.enabled = enabled;
        this.createdAt = createdAt;
        this.role=role;
    }



    public Long getId() {
        return id;
    }

    public String getEmail() {
        return email;
    }

    public String getPasswordHash() {
        return passwordHash;
    }

    public boolean isEnabled() {
        return enabled;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public String getRole() {
        return role;
    }
}
