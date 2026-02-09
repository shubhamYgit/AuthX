package org.authx.authx.refreshtoken;


import jakarta.persistence.*;
import org.authx.authx.user.User;

import java.time.Instant;

@Entity
@Table(name="refresh_tokens")
public class RefreshToken {


    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private long id;


    @ManyToOne(optional = false)
    @JoinColumn(name="user_id")
    private User user;

    @Column(nullable = false , unique = true)
    private String token;

    @Column(nullable = false )
    private Instant expiresAt;

    @Column(nullable = false)
    private boolean revoked;

    @Column(nullable = false)
    private Instant createdAt;

//    public RefreshToken(long id, User user, String token, Instant expiresAt, boolean revoked, Instant createdAt) {
//        this.id = id;
//        this.user = user;
//        this.token = token;
//        this.expiresAt = expiresAt;
//        this.revoked = revoked;
//        this.createdAt = createdAt;
//    }

    public RefreshToken(User user, String token, Instant expiresAt) {
        this.user = user;
        this.token = token;
        this.expiresAt = expiresAt;
        this.revoked = false;
        this.createdAt = Instant.now();
    }






    public long getId() {
        return id;
    }

    public void setId(long id) {
        this.id = id;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }

    public Instant getExpiresAt() {
        return expiresAt;
    }

    public void setExpiresAt(Instant expiresAt) {
        this.expiresAt = expiresAt;
    }

    public boolean isRevoked() {
        return revoked;
    }

    public void setRevoked(boolean revoked) {
        this.revoked = revoked;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }


    protected RefreshToken() {}

//    public RefreshToken(User user, String token, Instant expiresAt) {
//        this.user = user;
//        this.token = token;
//        this.expiresAt = expiresAt;
//    }
}
