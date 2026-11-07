package com.satee.inventory_management.service;

import org.springframework.stereotype.Service;

import java.util.List;

import com.satee.inventory_management.entity.Product;
import com.satee.inventory_management.entity.StockTransaction;
import com.satee.inventory_management.exception.InsufficientStockException;
import com.satee.inventory_management.repository.ProductRepository;
import com.satee.inventory_management.repository.StockTransactionRepository;
import com.satee.inventory_management.dto.StockTransactionResponseDTO;

@Service
public class StockService {

    private final ProductRepository productRepository;
    private final StockTransactionRepository stockTransactionRepository;

    public StockService(
            ProductRepository productRepository,
            StockTransactionRepository stockTransactionRepository) {

        this.productRepository = productRepository;
        this.stockTransactionRepository = stockTransactionRepository;
    }

    public StockTransactionResponseDTO stockIn(Long productId, int quantity) {

        Product product = productRepository.findById(productId)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Product not found with id: " + productId));

        product.setQuantity(product.getQuantity() + quantity);

        productRepository.save(product);

        StockTransaction transaction =
                new StockTransaction("STOCK_IN", quantity, product);

        StockTransaction savedTransaction = stockTransactionRepository.save(transaction);

        return convertToResponseDTO(savedTransaction);
    }

    public StockTransactionResponseDTO stockOut(Long productId, int quantity) {

        Product product = productRepository.findById(productId)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Product not found with id: " + productId));

        if (quantity > product.getQuantity()) {
            throw new InsufficientStockException(
                    "Insufficient stock. Available quantity: "
                            + product.getQuantity());
        }

        product.setQuantity(product.getQuantity() - quantity);

        productRepository.save(product);

        StockTransaction transaction =
                new StockTransaction("STOCK_OUT", quantity, product);

        StockTransaction savedTransaction = stockTransactionRepository.save(transaction);

        return convertToResponseDTO(savedTransaction);
    }

    public List<StockTransactionResponseDTO> getAllTransactions() {

        return stockTransactionRepository.findAll()
                .stream()
                .map(this::convertToResponseDTO)
                .toList();
    }

    private StockTransactionResponseDTO convertToResponseDTO(StockTransaction transaction) {

        return new StockTransactionResponseDTO(
                transaction.getId(),
                transaction.getType(),
                transaction.getQuantity(),
                transaction.getProduct().getId(),
                transaction.getProduct().getName()
        );
    }

}
