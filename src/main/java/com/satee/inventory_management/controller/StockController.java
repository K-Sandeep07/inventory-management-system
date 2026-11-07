package com.satee.inventory_management.controller;

import java.util.List;

import org.springframework.web.bind.annotation.*;

import com.satee.inventory_management.dto.StockTransactionResponseDTO;
import com.satee.inventory_management.service.StockService;

@RestController
@RequestMapping("/api/stock")
public class StockController {

    private final StockService stockService;

    public StockController(StockService stockService) {
        this.stockService = stockService;
    }

    @PostMapping("/in")
    public StockTransactionResponseDTO stockIn(
            @RequestParam Long productId,
            @RequestParam int quantity) {

        return stockService.stockIn(productId, quantity);
    }

    @PostMapping("/out")
    public StockTransactionResponseDTO stockOut(
            @RequestParam Long productId,
            @RequestParam int quantity) {

        return stockService.stockOut(productId, quantity);
    }

    @GetMapping("/transactions")
    public List<StockTransactionResponseDTO> getAllTransactions() {

        return stockService.getAllTransactions();
    }
}
