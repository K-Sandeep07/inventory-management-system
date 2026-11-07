package com.satee.inventory_management.service;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.web.multipart.MultipartFile;

import com.satee.inventory_management.dto.ProductRequestDTO;
import com.satee.inventory_management.dto.ProductResponseDTO;
import com.satee.inventory_management.entity.Product;
import com.satee.inventory_management.exception.ProductNotFoundException;
import com.satee.inventory_management.repository.CategoryRepository;
import com.satee.inventory_management.repository.ProductRepository;
import com.satee.inventory_management.entity.Category;
import com.satee.inventory_management.entity.Supplier;
import com.satee.inventory_management.repository.SupplierRepository;


@Service
public class ProductService {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final SupplierRepository supplierRepository;
    private final ProductImageService productImageService;

    public ProductService(ProductRepository productRepository, CategoryRepository categoryRepository, SupplierRepository supplierRepository, ProductImageService productImageService) {
        this.productRepository = productRepository;
        this.categoryRepository = categoryRepository;
        this.supplierRepository = supplierRepository;
        this.productImageService = productImageService;
    }

    // CREATE
    public ProductResponseDTO addProduct(ProductRequestDTO request) {
        Product product = new Product();
        product.setName(request.getName());
        product.setPrice(request.getPrice());
        product.setQuantity(request.getQuantity());
        if (request.getCategoryId() != null) {
            Category category = categoryRepository.findById(request.getCategoryId())
                    .orElseThrow(() -> new RuntimeException(
                            "Category not found with id: " + request.getCategoryId()));
            product.setCategory(category);
        }
        if (request.getSupplierId() != null) {
            Supplier supplier = supplierRepository.findById(request.getSupplierId())
                .orElseThrow(() -> new RuntimeException(
                        "Supplier not found with id: " + request.getSupplierId()));
            product.setSupplier(supplier);
        }
        Product savedProduct = productRepository.save(product);
        return convertToResponseDTO(savedProduct);
    }

    // GET ALL
    public List<ProductResponseDTO> getAllProducts() {

        return productRepository.findAll()
                .stream()
                .map(this::convertToResponseDTO)
                .collect(Collectors.toList());
    }

    // GET BY ID
    public ProductResponseDTO getProductById(Long id) {

        Product product = productRepository.findById(id)
                .orElseThrow(() ->
                        new ProductNotFoundException(
                                "Product not found with id: " + id
                        ));

        return convertToResponseDTO(product);
    }

    // UPDATE
    public ProductResponseDTO updateProduct(
            Long id,
            ProductRequestDTO request) {

        Product existingProduct = productRepository.findById(id)
                .orElseThrow(() ->
                        new ProductNotFoundException(
                                "Product not found with id: " + id
                        ));

        existingProduct.setName(request.getName());
        existingProduct.setPrice(request.getPrice());
        existingProduct.setQuantity(request.getQuantity());
        if (request.getCategoryId() != null) {
            Category category = categoryRepository.findById(request.getCategoryId())
                    .orElseThrow(() -> new RuntimeException("Category not found with id: " + request.getCategoryId()));
            existingProduct.setCategory(category);
        }
        if (request.getSupplierId() != null) {
            Supplier supplier = supplierRepository.findById(request.getSupplierId())
                    .orElseThrow(() -> new RuntimeException(
                            "Supplier not found with id: " + request.getSupplierId()));
            existingProduct.setSupplier(supplier);
        }

        Product updatedProduct =
                productRepository.save(existingProduct);

        return convertToResponseDTO(updatedProduct);
    }

    // DELETE
    public void deleteProduct(Long id) {

        Product product = productRepository.findById(id)
                .orElseThrow(() ->
                        new ProductNotFoundException(
                                "Product not found with id: " + id
                        ));

        productRepository.delete(product);
    }

    // ENTITY → RESPONSE DTO
    // ENTITY → RESPONSE DTO
    private ProductResponseDTO convertToResponseDTO(Product product) {
        ProductResponseDTO response = new ProductResponseDTO(
                product.getId(),
                product.getName(),
                product.getPrice(),
                product.getQuantity(),
                product.getCategory() != null
                        ? product.getCategory().getId()
                        : null,
                product.getCategory() != null
                        ? product.getCategory().getName()
                        : null,
                product.getSupplier() != null
                        ? product.getSupplier().getId()
                        : null,
                product.getSupplier() != null
                        ? product.getSupplier().getName()
                        : null
        );

        response.setImageName(product.getImageName());

        return response;
    }

    //Search name Method
    public List<ProductResponseDTO> searchProducts(String name) {
    return productRepository.findByNameContainingIgnoreCase(name)
            .stream()
            .map(this::convertToResponseDTO)
            .collect(Collectors.toList());
    }

    //Search price
    public List<ProductResponseDTO> filterByPrice(double minPrice, double maxPrice) {
        return productRepository.findByPriceBetween(minPrice, maxPrice)
                .stream()
                .map(this::convertToResponseDTO)
                .collect(Collectors.toList());
    }

    //Search quantity
    public List<ProductResponseDTO> filterByStock(int minQuantity) {
        return productRepository.findByQuantityGreaterThanEqual(minQuantity)
            .stream()
            .map(this::convertToResponseDTO)
            .collect(Collectors.toList());
    }

    //Sorting methods
    public List<ProductResponseDTO> sortProducts(String by, String order) {
        List<Product> products;
        if (by.equalsIgnoreCase("name")) {
            if (order.equalsIgnoreCase("desc")) {
                products = productRepository.findAllByOrderByNameDesc();
            } 
            else {
                products = productRepository.findAllByOrderByNameAsc();
            }
        } 
        else if (by.equalsIgnoreCase("price")) {
            if (order.equalsIgnoreCase("desc")) {
                products = productRepository.findAllByOrderByPriceDesc();
            }
            else {
                products = productRepository.findAllByOrderByPriceAsc();
            }
        } 
        else if (by.equalsIgnoreCase("quantity")) {
            if (order.equalsIgnoreCase("desc")) {
                products = productRepository.findAllByOrderByQuantityDesc();
            }
            else {
                products = productRepository.findAllByOrderByQuantityAsc();
            }
        }
        else {
            products = productRepository.findAll();
        }
        return products.stream()
                .map(this::convertToResponseDTO)
                .collect(Collectors.toList());
    }

    // UPLOAD PRODUCT IMAGE
    public ProductResponseDTO uploadProductImage(
            Long id, MultipartFile file) {

        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ProductNotFoundException(
                        "Product not found with id: " + id));

        String imageName = productImageService.storeImage(file);

        product.setImageName(imageName);

        Product updatedProduct = productRepository.save(product);

        return convertToResponseDTO(updatedProduct);
    }

    public Page<ProductResponseDTO> getProductsWithPagination(int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        return productRepository.findAll(pageable).map(this::convertToResponseDTO);
    }

    public ProductResponseDTO updateProductImageFromUrl(
        Long id, String imageUrl) {

    Product product = productRepository.findById(id)
            .orElseThrow(() -> new ProductNotFoundException(
                    "Product not found with id: " + id));

    String imageName =
            productImageService.storeImageFromUrl(imageUrl);

    product.setImageName(imageName);

    return convertToResponseDTO(productRepository.save(product));
}

    
}