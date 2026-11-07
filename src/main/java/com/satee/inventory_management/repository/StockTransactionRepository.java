package com.satee.inventory_management.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.satee.inventory_management.entity.StockTransaction;

public interface StockTransactionRepository
        extends JpaRepository<StockTransaction, Long> {
}
