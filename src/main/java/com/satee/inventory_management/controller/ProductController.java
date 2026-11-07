package com.satee.inventory_management.controller;

import java.util.List;
import java.util.Map;

import jakarta.validation.Valid;

import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.satee.inventory_management.dto.ProductRequestDTO;
import com.satee.inventory_management.dto.ProductResponseDTO;
import com.satee.inventory_management.service.ProductService;
import com.satee.inventory_management.service.ProductCsvImportService;
import com.satee.inventory_management.service.ProductBulkImageUpdateService;
import com.satee.inventory_management.service.ProductAutoImageService;

@RestController
@RequestMapping("/api/products")
public class ProductController {

    private final ProductService productService;
    private final ProductCsvImportService productCsvImportService;
    private final ProductBulkImageUpdateService productBulkImageUpdateService;
    private final ProductAutoImageService productAutoImageService;

    public ProductController(
            ProductService productService,
            ProductCsvImportService productCsvImportService,
            ProductBulkImageUpdateService productBulkImageUpdateService,
            ProductAutoImageService productAutoImageService) {

        this.productService = productService;
        this.productCsvImportService = productCsvImportService;
        this.productBulkImageUpdateService = productBulkImageUpdateService;
        this.productAutoImageService = productAutoImageService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ProductResponseDTO addProduct(@Valid @RequestBody ProductRequestDTO request) {
        return productService.addProduct(request);
    }

    @GetMapping
    public List<ProductResponseDTO> getAllProducts() {
        return productService.getAllProducts();
    }

    @GetMapping("/search")
    public List<ProductResponseDTO> searchProducts(@RequestParam String name) {
        return productService.searchProducts(name);
    }

    @GetMapping("/filter")
    public List<ProductResponseDTO> filterByPrice(
            @RequestParam double minPrice,
            @RequestParam double maxPrice) {
        return productService.filterByPrice(minPrice, maxPrice);
    }

    @GetMapping("/stock")
    public List<ProductResponseDTO> filterByStock(@RequestParam int minQuantity) {
        return productService.filterByStock(minQuantity);
    }

    @GetMapping("/sort")
    public List<ProductResponseDTO> sortProducts(
            @RequestParam String by,
            @RequestParam String order) {
        return productService.sortProducts(by, order);
    }

    @GetMapping("/page")
    public Page<ProductResponseDTO> getProductsWithPagination(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "5") int size) {
        return productService.getProductsWithPagination(page, size);
    }

    @GetMapping("/{id}")
    public ProductResponseDTO getProductById(@PathVariable Long id) {
        return productService.getProductById(id);
    }

    @PutMapping("/{id}")
    public ProductResponseDTO updateProduct(
            @PathVariable Long id,
            @Valid @RequestBody ProductRequestDTO request) {
        return productService.updateProduct(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteProduct(@PathVariable Long id) {
        productService.deleteProduct(id);
    }

    @PostMapping(value = "/{id}/image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ProductResponseDTO uploadProductImage(
            @PathVariable Long id,
            @RequestParam("file") MultipartFile file) {
        return productService.uploadProductImage(id, file);
    }

    @PostMapping(value = "/import-csv", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public Map<String, Object> importProductsFromCsv(@RequestParam("file") MultipartFile file) {
        return productCsvImportService.importProducts(file);
    }

    @PostMapping("/{id}/image-url")
    public ProductResponseDTO updateProductImageFromUrl(
            @PathVariable Long id,
            @RequestParam String url) {
        return productService.updateProductImageFromUrl(id, url);
    }

    @PostMapping(value = "/images/import-csv", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public Map<String, Object> bulkUpdateProductImages(@RequestParam("file") MultipartFile file) {
        return productBulkImageUpdateService.updateImages(file);
    }

    @PostMapping(value = "/images/bulk-upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public Map<String, Object> bulkUploadProductImages(
            @RequestParam("files") List<MultipartFile> files) {
        return productBulkImageUpdateService.updateImagesFromFiles(files);
    }

    // Automatically find openly licensed images using product names.
    @PostMapping("/images/auto-fetch")
    public Map<String, Object> autoFetchProductImages(
            @RequestParam(defaultValue = "100") Integer limit) {
        return productAutoImageService.fetchImagesForProducts(limit);
    }
}
