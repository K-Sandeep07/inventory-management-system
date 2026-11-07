package com.satee.inventory_management.service;

import java.time.LocalDateTime;
import java.util.Random;

import org.springframework.stereotype.Service;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import com.satee.inventory_management.dto.ForgotPasswordRequestDTO;
import com.satee.inventory_management.dto.LoginRequestDTO;
import com.satee.inventory_management.dto.RegisterRequestDTO;
import com.satee.inventory_management.dto.ResetPasswordRequestDTO;
import com.satee.inventory_management.dto.VerifyOtpRequestDTO;
import com.satee.inventory_management.entity.OtpVerification;

import com.satee.inventory_management.repository.OtpVerificationRepository;
import com.satee.inventory_management.repository.UserRepository;
import com.satee.inventory_management.entity.User;


@Service
public class AuthService {

    private final UserRepository userRepository;
    private final OtpVerificationRepository otpRepository;
    private final EmailService emailService;
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();
    private final JwtService jwtService;

    public AuthService(
            UserRepository userRepository,
            OtpVerificationRepository otpRepository,
            EmailService emailService,
            JwtService jwtService) {

        this.userRepository = userRepository;
        this.otpRepository = otpRepository;
        this.emailService = emailService;
        this.jwtService = jwtService;
    }

    public String register(RegisterRequestDTO request) {

        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            return "Email already registered";
        }

        String otp = String.format(
                "%06d",
                new Random().nextInt(1000000)
        );

        String passwordHash =
        passwordEncoder.encode(request.getPassword());

        OtpVerification verification = new OtpVerification(
                request.getEmail(),
                otp,
                "REGISTRATION",
                LocalDateTime.now().plusMinutes(5),
                false,
                passwordHash
        );

        otpRepository.save(verification);

        emailService.sendOtpEmail(
                request.getEmail(),
                otp
        );

        return "OTP sent successfully to your email";
    }
    
    public String verifyRegistrationOtp(VerifyOtpRequestDTO request) {

        OtpVerification verification =
                otpRepository
                        .findTopByEmailAndTypeOrderByIdDesc(
                                request.getEmail(),
                                "REGISTRATION")
                        .orElseThrow(() ->
                                new RuntimeException("OTP not found"));

        if (verification.isVerified()) {
            return "OTP already used";
        }

        if (verification.getExpiresAt().isBefore(LocalDateTime.now())) {
            return "OTP expired";
        }

        if (!verification.getOtp().equals(request.getOtp())) {
            return "Invalid OTP";
        }

        verification.setVerified(true);
        otpRepository.save(verification);

        User user = new User(
            request.getEmail(),
            verification.getPasswordHash(),
            "USER",
            true
        );

        userRepository.save(user);

        return "Account created successfully";
    }

    public String login(LoginRequestDTO request) {

        User user = userRepository
                .findByEmail(request.getEmail())
                .orElseThrow(() ->
                        new RuntimeException("Invalid email or password"));

        if (!passwordEncoder.matches(
                request.getPassword(),
                user.getPassword())) {

            throw new RuntimeException("Invalid email or password");
        }

        if (!user.isEmailVerified()) {
            throw new RuntimeException("Email is not verified");
        }

        return jwtService.generateToken(user);
    }
    public String generatePasswordHash(String password) {
        return passwordEncoder.encode(password);
    }

    public String forgotPassword(ForgotPasswordRequestDTO request) {
        User user = userRepository
                .findByEmail(request.getEmail())
                .orElseThrow(() ->
                        new RuntimeException("Email not registered"));
        String otp = String.format(
                "%06d",
                new Random().nextInt(1000000)
        );
        OtpVerification verification = new OtpVerification(
                request.getEmail(),
                otp,
                "FORGOT_PASSWORD",
                LocalDateTime.now().plusMinutes(5),
                false,
                user.getPassword()
        );
        otpRepository.save(verification);
        emailService.sendOtpEmail(
                request.getEmail(),
                otp
        );
        return "Password reset OTP sent successfully";
    }

    public String resetPassword(ResetPasswordRequestDTO request) {

        OtpVerification verification =
                otpRepository
                        .findTopByEmailAndTypeOrderByIdDesc(
                                request.getEmail(),
                                "FORGOT_PASSWORD")
                        .orElseThrow(() ->
                                new RuntimeException("OTP not found"));

        if (verification.isVerified()) {
            return "OTP already used";
        }

        if (verification.getExpiresAt()
                .isBefore(LocalDateTime.now())) {
            return "OTP expired";
        }

        if (!verification.getOtp()
                .equals(request.getOtp())) {
            return "Invalid OTP";
        }

        User user = userRepository
                .findByEmail(request.getEmail())
                .orElseThrow(() ->
                        new RuntimeException("User not found"));

        user.setPassword(
                passwordEncoder.encode(request.getNewPassword())
        );

        userRepository.save(user);

        verification.setVerified(true);
        otpRepository.save(verification);

        return "Password reset successfully";
    }
}