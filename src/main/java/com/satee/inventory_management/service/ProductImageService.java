package com.satee.inventory_management.service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Set;
import java.util.UUID;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.net.InetAddress;
import java.net.URI;
import java.net.URLConnection;
import java.net.HttpURLConnection;
import java.util.Locale;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

@Service
public class ProductImageService {

    private static final long MAX_FILE_SIZE = 5 * 1024 * 1024;

    private static final Set<String> ALLOWED_TYPES = Set.of(
            "image/jpeg",
            "image/png",
            "image/webp"
    );

    private final Path uploadDirectory;

    public ProductImageService(
            @Value("${app.upload.dir:uploads/product-images}")
            String uploadDirectory) {

        this.uploadDirectory = Paths.get(uploadDirectory)
                .toAbsolutePath()
                .normalize();
    }

    public String storeImage(MultipartFile file) {

        if (file == null || file.isEmpty()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Please select an image file"
            );
        }

        if (file.getSize() > MAX_FILE_SIZE) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Image size must not exceed 5 MB"
            );
        }

        String contentType = file.getContentType();

        if (contentType == null ||
                !ALLOWED_TYPES.contains(contentType.toLowerCase())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Only JPEG, PNG, and WebP images are allowed"
            );
        }

        String extension = switch (contentType.toLowerCase()) {
            case "image/jpeg" -> ".jpg";
            case "image/png" -> ".png";
            case "image/webp" -> ".webp";
            default -> throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Unsupported image type"
            );
        };

        String imageName = UUID.randomUUID() + extension;
        Path target = uploadDirectory.resolve(imageName).normalize();

        if (!target.startsWith(uploadDirectory)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Invalid image path"
            );
        }

        try {
            Files.createDirectories(uploadDirectory);
            Files.copy(file.getInputStream(), target);
            return imageName;
        } catch (IOException e) {
            throw new ResponseStatusException(
                    HttpStatus.INTERNAL_SERVER_ERROR,
                    "Could not save product image"
            );
        }
    }

    public String storeImageFromUrl(String imageUrl) {
    HttpURLConnection connection = null;

    try {
        URI uri = URI.create(imageUrl.trim());
        String scheme = uri.getScheme();

        if (uri.getHost() == null ||
                !("https".equalsIgnoreCase(scheme)
                || "http".equalsIgnoreCase(scheme))) {
            throw new IllegalArgumentException(
                    "Please provide a valid HTTP or HTTPS image URL");
        }

        String host = uri.getHost();

        if ("localhost".equalsIgnoreCase(host)
                || host.endsWith(".localhost")) {
            throw new IllegalArgumentException(
                    "Local image URLs are not allowed");
        }

        for (InetAddress address :
                InetAddress.getAllByName(host)) {
            if (address.isAnyLocalAddress()
                    || address.isLoopbackAddress()
                    || address.isSiteLocalAddress()
                    || address.isLinkLocalAddress()
                    || address.isMulticastAddress()) {
                throw new IllegalArgumentException(
                        "Private network image URLs are not allowed");
            }
        }

        URLConnection rawConnection = uri.toURL().openConnection();

        if (!(rawConnection instanceof HttpURLConnection)) {
            throw new IllegalArgumentException(
                    "Only HTTP image URLs are supported");
        }

        connection = (HttpURLConnection) rawConnection;
        connection.setInstanceFollowRedirects(false);
        connection.setConnectTimeout(5000);
        connection.setReadTimeout(10000);
        connection.setRequestProperty(
                "User-Agent", "InventoryManagement/1.0");

        int status = connection.getResponseCode();

        if (status < 200 || status >= 300) {
            throw new IllegalArgumentException(
                    "Image URL returned HTTP " + status);
        }

        String contentType = connection.getContentType();

        if (contentType == null) {
            throw new IllegalArgumentException(
                    "Image URL has no content type");
        }

        contentType = contentType.split(";")[0]
                .trim().toLowerCase(Locale.ROOT);

        String extension = switch (contentType) {
            case "image/jpeg" -> ".jpg";
            case "image/png" -> ".png";
            case "image/webp" -> ".webp";
            default -> throw new IllegalArgumentException(
                    "Only JPEG, PNG, and WebP images are supported");
        };

        int contentLength = connection.getContentLength();

        if (contentLength > MAX_FILE_SIZE) {
            throw new IllegalArgumentException(
                    "Image size must not exceed 5 MB");
        }

        ByteArrayOutputStream output = new ByteArrayOutputStream();

        try (InputStream input = connection.getInputStream()) {
            byte[] buffer = new byte[8192];
            int count;
            long total = 0;

            while ((count = input.read(buffer)) != -1) {
                total += count;

                if (total > MAX_FILE_SIZE) {
                    throw new IllegalArgumentException(
                            "Image size must not exceed 5 MB");
                }

                output.write(buffer, 0, count);
            }
        }

        byte[] imageBytes = output.toByteArray();

        // Verify that the downloaded content matches its image type.
        boolean validSignature =
                contentType.equals("image/jpeg")
                        && imageBytes.length >= 3
                        && (imageBytes[0] & 0xFF) == 0xFF
                        && (imageBytes[1] & 0xFF) == 0xD8
                        && (imageBytes[2] & 0xFF) == 0xFF
                || contentType.equals("image/png")
                        && imageBytes.length >= 8
                        && (imageBytes[0] & 0xFF) == 0x89
                        && imageBytes[1] == 0x50
                        && imageBytes[2] == 0x4E
                        && imageBytes[3] == 0x47
                || contentType.equals("image/webp")
                        && imageBytes.length >= 12
                        && new String(imageBytes, 0, 4,
                                java.nio.charset.StandardCharsets.US_ASCII)
                                .equals("RIFF")
                        && new String(imageBytes, 8, 4,
                                java.nio.charset.StandardCharsets.US_ASCII)
                                .equals("WEBP");

        if (!validSignature) {
            throw new IllegalArgumentException(
                    "Downloaded content is not a valid supported image");
        }

        Files.createDirectories(uploadDirectory);

        String imageName = UUID.randomUUID() + extension;
        Path target = uploadDirectory.resolve(imageName).normalize();

        if (!target.startsWith(uploadDirectory)) {
            throw new IllegalArgumentException("Invalid image path");
        }

        Files.write(target, imageBytes);
        return imageName;

    } catch (IllegalArgumentException e) {
        throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST, e.getMessage());
    } catch (Exception e) {
        throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Could not download the image URL");
    } finally {
        if (connection != null) {
            connection.disconnect();
        }
    }
}
}