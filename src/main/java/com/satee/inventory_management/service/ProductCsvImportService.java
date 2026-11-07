
package com.satee.inventory_management.service;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

import com.satee.inventory_management.entity.Category;
import com.satee.inventory_management.entity.Product;
import com.satee.inventory_management.entity.Supplier;
import com.satee.inventory_management.repository.CategoryRepository;
import com.satee.inventory_management.repository.ProductRepository;
import com.satee.inventory_management.repository.SupplierRepository;

@Service
public class ProductCsvImportService {

    private static final long MAX_CSV_SIZE = 5 * 1024 * 1024;
    private static final int MAX_ROWS = 5000;

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final SupplierRepository supplierRepository;
    private final ProductImageService productImageService;

    public ProductCsvImportService(
            ProductRepository productRepository,
            CategoryRepository categoryRepository,
            SupplierRepository supplierRepository,
            ProductImageService productImageService) {
        this.productRepository = productRepository;
        this.categoryRepository = categoryRepository;
        this.supplierRepository = supplierRepository;
        this.productImageService = productImageService;
    }


    public Map<String, Object> importProducts(MultipartFile file) {

        if (file == null || file.isEmpty()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Please select a CSV file");
        }

        if (file.getSize() > MAX_CSV_SIZE) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "CSV file must not exceed 5 MB");
        }

        List<Product> validProducts = new ArrayList<>();
        List<Map<String, Object>> errors = new ArrayList<>();
        List<String> headers;


        try (BufferedReader reader = new BufferedReader(
                new InputStreamReader(file.getInputStream(),
                        StandardCharsets.UTF_8))) {

            String headerLine = reader.readLine();

            if (headerLine == null) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST, "CSV file is empty");
            }

            headers = parseCsvLine(headerLine.replace("\uFEFF", ""));

            Map<String, Integer> columns = new LinkedHashMap<>();

            for (int i = 0; i < headers.size(); i++) {
                columns.put(headers.get(i).trim()
                        .toLowerCase(Locale.ROOT), i);
            }

            if (!columns.keySet().containsAll(
                    List.of("name", "price", "quantity"))) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "CSV must contain name, price, and quantity columns");
            }

            String line;
            int rowNumber = 1;
            int processedRows = 0;

            while ((line = reader.readLine()) != null) {
                rowNumber++;

                if (line.isBlank()) {
                    continue;
                }

                processedRows++;

                if (processedRows > MAX_ROWS) {
                    throw new ResponseStatusException(
                            HttpStatus.BAD_REQUEST,
                            "CSV cannot contain more than " + MAX_ROWS
                                    + " product rows");
                }

                try {
                    List<String> values = parseCsvLine(line);

                    String name = getValue(values, columns, "name");
                    double price = Double.parseDouble(
                            getValue(values, columns, "price"));
                    int quantity = Integer.parseInt(
                            getValue(values, columns, "quantity"));

                    if (name.isBlank()) {
                        throw new IllegalArgumentException(
                                "Product name is required");
                    }

                    if (price < 0 || !Double.isFinite(price)) {
                        throw new IllegalArgumentException(
                                "Price must be a valid non-negative number");
                    }

                    if (quantity < 0) {
                        throw new IllegalArgumentException(
                                "Quantity cannot be negative");
                    }

                    Product product = new Product();
                    product.setName(name);
                    product.setPrice(price);
                    product.setQuantity(quantity);

                    String categoryId = getValue(
                            values, columns, "categoryId");

                    if (!categoryId.isBlank()) {
                        Category category = categoryRepository.findById(
                                Long.parseLong(categoryId))
                                .orElseThrow(() ->
                                        new IllegalArgumentException(
                                                "Category not found: "
                                                        + categoryId));
                        product.setCategory(category);
                    }

                    String supplierId = getValue(
                            values, columns, "supplierId");

                    if (!supplierId.isBlank()) {
                        Supplier supplier = supplierRepository.findById(
                                Long.parseLong(supplierId))
                                .orElseThrow(() ->
                                        new IllegalArgumentException(
                                                "Supplier not found: "
                                                        + supplierId));
                        product.setSupplier(supplier);
                    }

                    String imageUrl = getValue(values, columns, "imageUrl");

                    if (!imageUrl.isBlank()) {
                        product.setImageName(
                                productImageService.storeImageFromUrl(imageUrl));
                    }

                    validProducts.add(product);

                } catch (Exception e) {
                    Map<String, Object> error = new LinkedHashMap<>();
                    error.put("row", rowNumber);
                    error.put("message",
                            e.getMessage() == null
                                    ? "Invalid product data"
                                    : e.getMessage());
                    errors.add(error);
                }
            }

        } catch (IOException e) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Could not read CSV file");
        }

        productRepository.saveAll(validProducts);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("totalRows", validProducts.size() + errors.size());
        result.put("successCount", validProducts.size());
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
