package com.satee.inventory_management.controller;

import org.springframework.web.bind.annotation.*;

import com.satee.inventory_management.dto.ForgotPasswordRequestDTO;
import com.satee.inventory_management.dto.LoginRequestDTO;
import com.satee.inventory_management.dto.RegisterRequestDTO;
import com.satee.inventory_management.dto.ResetPasswordRequestDTO;
import com.satee.inventory_management.dto.VerifyOtpRequestDTO;
import com.satee.inventory_management.service.AuthService;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    public String register(@RequestBody RegisterRequestDTO request) {
        return authService.register(request);
    }

    @PostMapping("/verify-otp")
    public String verifyOtp(@RequestBody VerifyOtpRequestDTO request) {
        return authService.verifyRegistrationOtp(request);
    }

    @PostMapping("/login")
    public String login(@RequestBody LoginRequestDTO request) {
        return authService.login(request);
    }

    @PostMapping("/forgot-password")
    public String forgotPassword(
            @RequestBody ForgotPasswordRequestDTO request) {

        return authService.forgotPassword(request);
    }

    @PostMapping("/reset-password")
    public String resetPassword(
            @RequestBody ResetPasswordRequestDTO request) {

        return authService.resetPassword(request);
    }
}