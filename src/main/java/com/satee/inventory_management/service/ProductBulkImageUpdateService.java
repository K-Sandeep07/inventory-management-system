
package com.satee.inventory_management.service;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import com.satee.inventory_management.entity.Product;
import com.satee.inventory_management.repository.ProductRepository;

@Service
public class ProductBulkImageUpdateService {

    private static final long MAX_CSV_SIZE = 5 * 1024 * 1024;
    private static final int MAX_ROWS = 5000;
    private static final int MAX_IMAGE_FILES = 500;

    private static final Pattern IMAGE_FILENAME_PATTERN =
            Pattern.compile("^(\\d+)\\.(jpg|jpeg|png|webp)$",
                    Pattern.CASE_INSENSITIVE);

    private final ProductRepository productRepository;
    private final ProductImageService productImageService;

    public ProductBulkImageUpdateService(
            ProductRepository productRepository,
            ProductImageService productImageService) {
        this.productRepository = productRepository;
        this.productImageService = productImageService;
    }

    // EXISTING FEATURE: Import images using CSV URLs
    public Map<String, Object> updateImages(MultipartFile file) {

        if (file == null || file.isEmpty()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Please select a CSV file");
        }

        if (file.getSize() > MAX_CSV_SIZE) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "CSV file must not exceed 5 MB");
        }

        List<Map<String, Object>> errors = new ArrayList<>();
        Set<Long> processedProductIds = new HashSet<>();

        int totalRows = 0;
        int successCount = 0;

        try (BufferedReader reader = new BufferedReader(
                new InputStreamReader(
                        file.getInputStream(), StandardCharsets.UTF_8))) {

            String headerLine = reader.readLine();

            if (headerLine == null) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST, "CSV file is empty");
            }

            List<String> headers = parseCsvLine(
                    headerLine.replace("\uFEFF", ""));

            Map<String, Integer> columns = new LinkedHashMap<>();

            for (int i = 0; i < headers.size(); i++) {
                columns.put(
                        headers.get(i).trim().toLowerCase(Locale.ROOT), i);
            }

            if (!columns.containsKey("productid")
                    || !columns.containsKey("imageurl")) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "CSV must contain productId and imageUrl columns");
            }

            String line;
            int rowNumber = 1;

            while ((line = reader.readLine()) != null) {
                rowNumber++;

                if (line.isBlank()) {
                    continue;
                }

                totalRows++;

                if (totalRows > MAX_ROWS) {
                    throw new ResponseStatusException(
                            HttpStatus.BAD_REQUEST,
                            "CSV cannot contain more than "
                                    + MAX_ROWS + " rows");
                }

                try {
                    List<String> values = parseCsvLine(line);

                    String idValue = getValue(
                            values, columns, "productId");

                    String imageUrl = getValue(
                            values, columns, "imageUrl");

                    if (idValue.isBlank()) {
                        throw new IllegalArgumentException(
                                "Product ID is required");
                    }

                    if (imageUrl.isBlank()) {
                        throw new IllegalArgumentException(
                                "Image URL is required");
                    }

                    long productId = Long.parseLong(idValue);

                    if (!processedProductIds.add(productId)) {
                        throw new IllegalArgumentException(
                                "Duplicate product ID in CSV: " + productId);
                    }

                    Product product = productRepository.findById(productId)
                            .orElseThrow(() ->
                                    new IllegalArgumentException(
                                            "Product not found: " + productId));

                    String imageName =
                            productImageService.storeImageFromUrl(imageUrl);

                    product.setImageName(imageName);
                    productRepository.save(product);

                    successCount++;

                } catch (Exception e) {
                    Map<String, Object> error = new LinkedHashMap<>();
                    error.put("row", rowNumber);
                    error.put(
                            "message",
                            e.getMessage() == null
                                    ? "Could not update product image"
                                    : e.getMessage());
                    errors.add(error);
                }
            }

        } catch (IOException e) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Could not read CSV file");
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("totalRows", totalRows);
        result.put("successCount", successCount);
        result.put("failureCount", errors.size());
        result.put("errors", errors);

        return result;
    }

    // NEW FEATURE: Upload multiple product images using filenames
    public Map<String, Object> updateImagesFromFiles(
            List<MultipartFile> files) {

        if (files == null || files.isEmpty()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Please select product images");
        }

        if (files.size() > MAX_IMAGE_FILES) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Maximum " + MAX_IMAGE_FILES + " images allowed per upload");
        }

        List<Map<String, Object>> errors = new ArrayList<>();
        Set<Long> processedProductIds = new HashSet<>();

        int successCount = 0;

        for (MultipartFile file : files) {

            String filename = file == null
                    ? ""
                    : file.getOriginalFilename();

            try {
                if (file == null || file.isEmpty()) {
                    throw new IllegalArgumentException(
                            "Image file is empty");
                }

                if (filename == null || filename.isBlank()) {
                    throw new IllegalArgumentException(
                            "Image filename is missing");
                }

                // Extract only the filename, not any client-supplied path.
                String safeFilename = filename.replace("\\", "/");
                safeFilename = safeFilename.substring(
                        safeFilename.lastIndexOf('/') + 1);

                Matcher matcher =
                        IMAGE_FILENAME_PATTERN.matcher(safeFilename);

                if (!matcher.matches()) {
                    throw new IllegalArgumentException(
                            "Filename must be productId.jpg, .jpeg, .png or .webp");
                }

                long productId = Long.parseLong(matcher.group(1));

                if (!processedProductIds.add(productId)) {
                    throw new IllegalArgumentException(
                            "Duplicate product ID: " + productId);
                }

                Product product = productRepository.findById(productId)
                        .orElseThrow(() ->
                                new IllegalArgumentException(
                                        "Product not found: " + productId));

                // Save the image using the existing image service.
                String imageName = productImageService.storeImage(file);

                product.setImageName(imageName);
                productRepository.save(product);

                successCount++;

            } catch (Exception e) {

                Map<String, Object> error = new LinkedHashMap<>();

                error.put("filename",
                        filename == null ? "Unknown file" : filename);

                error.put("message",
                        e.getMessage() == null
                                ? "Could not update product image"
                                : e.getMessage());

                errors.add(error);
            }
        }

        Map<String, Object> result = new LinkedHashMap<>();

        result.put("totalFiles", files.size());
        result.put("successCount", successCount);
        result.put("failureCount", errors.size());
        result.put("errors", errors);

        return result;
    }

    private String getValue(
            List<String> values,
            Map<String, Integer> columns,
            String columnName) {

        Integer index = columns.get(columnName.toLowerCase(Locale.ROOT));

        if (index == null || index >= values.size()) {
            return "";
        }

        return values.get(index).trim();
    }

    private List<String> parseCsvLine(String line) {

        List<String> values = new ArrayList<>();
        StringBuilder value = new StringBuilder();
        boolean insideQuotes = false;

        for (int i = 0; i < line.length(); i++) {
            char c = line.charAt(i);

            if (c == '"') {
                if (insideQuotes
                        && i + 1 < line.length()
                        && line.charAt(i + 1) == '"') {
                    value.append('"');
                    i++;
                } else {
                    insideQuotes = !insideQuotes;
                }
            } else if (c == ',' && !insideQuotes) {
                values.add(value.toString());
                value.setLength(0);
            } else {
                value.append(c);
            }
        }

        if (insideQuotes) {
            throw new IllegalArgumentException(
                    "CSV row contains an unclosed quote");
        }

        values.add(value.toString());
        return values;
    }
}
