package com.satee.inventory_management.service;

import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private final JavaMailSender mailSender;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    public void sendOtpEmail(String email, String otp) {

        SimpleMailMessage message = new SimpleMailMessage();

        message.setTo(email);
        message.setSubject("Inventory Management - OTP Verification");

        message.setText(
                "Your OTP is: " + otp
                + "\n\nThis OTP is valid for 5 minutes."
                + "\n\nPlease do not share this OTP with anyone."
        );

        mailSender.send(message);
    }
}