package com.satee.inventory_management.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import java.util.List;

@Configuration
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    public SecurityConfig(
            JwtAuthenticationFilter jwtAuthenticationFilter) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(
            HttpSecurity http) throws Exception {

        http
            .csrf(csrf -> csrf.disable())
            .cors(cors -> {})
            .sessionManagement(session ->
                session.sessionCreationPolicy(
                    SessionCreationPolicy.STATELESS
                )
            )

            .authorizeHttpRequests(auth -> auth

                // Authentication APIs are public
                .requestMatchers("/api/auth/**")
                .permitAll()
                // Uploaded product images can be viewed publicly
                .requestMatchers(
                    HttpMethod.GET,
                    "/product-images/**"
                )
                .permitAll()

                // USER + ADMIN can view
                .requestMatchers(
                    HttpMethod.GET,
                    "/api/products/**",
                    "/api/categories/**",
                    "/api/suppliers/**",
                    "/api/stock/transactions"
                )
                .hasAnyRole("USER", "ADMIN")

                // Only ADMIN can create
                .requestMatchers(
                    HttpMethod.POST,
                    "/api/products/**",
                    "/api/categories/**",
                    "/api/suppliers/**"
                )
                .hasRole("ADMIN")

                // Only ADMIN can update
                .requestMatchers(
                    HttpMethod.PUT,
                    "/api/products/**",
                    "/api/categories/**",
                    "/api/suppliers/**"
                )
                .hasRole("ADMIN")

                // Only ADMIN can delete
                .requestMatchers(
                    HttpMethod.DELETE,
                    "/api/products/**",
                    "/api/categories/**",
                    "/api/suppliers/**"
                )
                .hasRole("ADMIN")

                // Only ADMIN can manage stock
                .requestMatchers(
                    HttpMethod.POST,
                    "/api/stock/**"
                )
                .hasRole("ADMIN")

                // Everything else requires authentication
                .anyRequest()
                .authenticated()
            )

            .addFilterBefore(
                jwtAuthenticationFilter,
                UsernamePasswordAuthenticationFilter.class
            );

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();

        configuration.setAllowedOrigins(
                List.of("http://localhost:5173")
        );

        configuration.setAllowedMethods(
                List.of("GET", "POST", "PUT", "DELETE", "OPTIONS")
        );

        configuration.setAllowedHeaders(
                List.of("*")
        );

        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source =
                new UrlBasedCorsConfigurationSource();

        source.registerCorsConfiguration("/**", configuration);

        return source;
    }
}