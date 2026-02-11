package org.authx.authx.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;

/**
 * CORS Configuration for AuthX
 *
 * Add this configuration class to your Spring Boot project to enable
 * Cross-Origin Resource Sharing (CORS) for your frontend application.
 *
 * This allows the HTML/CSS/JavaScript frontend to make API calls to your
 * Spring Boot backend running on localhost:8080
 */
@Configuration
public class CorsConfig {

    @Bean
    public CorsFilter corsFilter() {
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        CorsConfiguration config = new CorsConfiguration();

        // Allow credentials (cookies, authorization headers)
        config.setAllowCredentials(true);

        // Allow all origins (for development)
        // In production, specify exact origins: config.addAllowedOrigin("https://yourdomain.com")
        config.addAllowedOriginPattern("*");

        // Allow all headers
        config.addAllowedHeader("*");

        // Allow all HTTP methods (GET, POST, PUT, DELETE, etc.)
        config.addAllowedMethod("*");

        // Apply CORS configuration to all endpoints
        source.registerCorsConfiguration("/**", config);

        return new CorsFilter(source);
    }
}