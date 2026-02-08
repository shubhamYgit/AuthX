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
    private long id;

    @Column(nullable = false , length=255)
    private String email;

    @Column(name = "password_hash" , nullable = false,length = 255)
    private String passwordHash;

    @Column(nullable = false)
    private boolean enabled;

    private Instant createdAt;

    protected User(){}

    public User(long id, String email, String passwordHash, boolean enabled, Instant createdAt) {
        this.id = id;
        this.email = email;
        this.passwordHash = passwordHash;
        this.enabled = enabled;
        this.createdAt = createdAt;
    }

    public long getId() {
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
}
