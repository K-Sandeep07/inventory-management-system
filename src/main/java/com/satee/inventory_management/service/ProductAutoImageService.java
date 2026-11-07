package com.satee.inventory_management.service;

import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import tools.jackson.databind.json.JsonMapper;
import com.satee.inventory_management.entity.Product;
import com.satee.inventory_management.repository.ProductRepository;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.net.URI;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Finds openly licensed product-related images using the Openverse API
 * and stores them through the existing ProductImageService.
 */
@Service
public class ProductAutoImageService {

    private static final String OPENVERSE_API =
            "https://api.openverse.org/v1/images/";

    private static final int MAX_PRODUCTS_PER_REQUEST = 100;
    private static final long REQUEST_DELAY_MS = 350L;

    private final ProductRepository productRepository;
    private final ProductImageService productImageService;
    private final JsonMapper objectMapper;
    private final RestClient restClient;

    public ProductAutoImageService(
            ProductRepository productRepository,
            ProductImageService productImageService,
            JsonMapper objectMapper) {
        this.productRepository = productRepository;
        this.productImageService = productImageService;
        this.objectMapper = objectMapper;
        this.restClient = RestClient.create();
    }

    /**
     * Fetches images for products that do not already have an image.
     * Existing product images are preserved.
     */
    public Map<String, Object> fetchImagesForProducts(Integer requestedLimit) {
        int limit = requestedLimit == null ? MAX_PRODUCTS_PER_REQUEST : requestedLimit;

        if (limit < 1 || limit > MAX_PRODUCTS_PER_REQUEST) {
            throw new IllegalArgumentException(
                    "Limit must be between 1 and " + MAX_PRODUCTS_PER_REQUEST);
        }

        List<Product> products = productRepository.findAll();

        List<Map<String, Object>> results = new ArrayList<>();
        int successCount = 0;
        int skippedCount = 0;
        int failureCount = 0;
        int processedCount = 0;

        for (Product product : products) {
            if (processedCount >= limit) {
                break;
            }

            if (product.getImageName() != null
                    && !product.getImageName().isBlank()) {
                skippedCount++;
                continue;
            }

            processedCount++;

            Map<String, Object> item = new LinkedHashMap<>();
            item.put("productId", product.getId());
            item.put("productName", product.getName());

            try {
                JsonNode image = findImage(product.getName());

                if (image == null || image.path("url").asText("").isBlank()) {
                    failureCount++;
                    item.put("status", "FAILED");
                    item.put("message", "No suitable openly licensed image was found.");
                } else {
                    String imageUrl = image.path("url").asText();
                    String savedImageName =
                            productImageService.storeImageFromUrl(imageUrl);

                    product.setImageName(savedImageName);
                    productRepository.save(product);

                    successCount++;
                    item.put("status", "SUCCESS");
                    item.put("imageName", savedImageName);
                    item.put("imageTitle", image.path("title").asText(""));
                    item.put("creator", image.path("creator").asText(""));
                    item.put("license", image.path("license").asText(""));
                    item.put("licenseUrl", image.path("license_url").asText(""));
                    item.put("sourcePage",
                            image.path("foreign_landing_url").asText(""));
                    item.put("attribution",
                            image.path("attribution").asText(""));
                }
            } catch (Exception exception) {
                failureCount++;
                item.put("status", "FAILED");
                item.put("message", safeMessage(exception));
            }

            results.add(item);

            // Be polite to the public API and reduce the chance of rate limiting.
            if (processedCount < limit) {
                try {
                    Thread.sleep(REQUEST_DELAY_MS);
                } catch (InterruptedException exception) {
                    Thread.currentThread().interrupt();
                    break;
                }
            }
        }

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("requestedLimit", limit);
        response.put("processedCount", processedCount);
        response.put("successCount", successCount);
        response.put("skippedCount", skippedCount);
        response.put("failureCount", failureCount);
        response.put("results", results);
        response.put("message",
                "Automatic image search finished. Existing product images were not changed.");
        return response;
    }

    private JsonNode findImage(String productName) {
        String encodedName =
                URLEncoder.encode(productName, StandardCharsets.UTF_8);

        URI searchUri = URI.create(
                OPENVERSE_API + "?q=" + encodedName
                        + "&page_size=5&mature=false");

        String json = restClient.get()
                .uri(searchUri)
                .header("Accept", "application/json")
                .header("User-Agent", "InventoryManagementProject/1.0")
                .retrieve()
                .body(String.class);

        if (json == null || json.isBlank()) {
            return null;
        }

        try {
            JsonNode root = objectMapper.readTree(json);
            JsonNode results = root.path("results");

            if (!results.isArray()) {
                return null;
            }

            // Try multiple results because some source image URLs may be unavailable
            // or may not be supported by the existing image validation service.
            for (JsonNode candidate : results) {
                String url = candidate.path("url").asText("");

                if (url.startsWith("https://") || url.startsWith("http://")) {
                    return candidate;
                }
            }
            return null;
        } catch (Exception exception) {
            throw new IllegalStateException(
                    "Could not read the Openverse image search response.", exception);
        }
    }

    private String safeMessage(Exception exception) {
        if (exception instanceof RestClientException) {
            return "Image search service is temporarily unavailable or rate-limited. Try again later.";
        }

        String message = exception.getMessage();
        if (message == null || message.isBlank()) {
            return "The image could not be downloaded or saved.";
        }
        return message;
    }
}
