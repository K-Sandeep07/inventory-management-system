package com.satee.inventory_management.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.satee.inventory_management.entity.Product;

public interface ProductRepository extends JpaRepository<Product, Long> {
    List<Product> findByNameContainingIgnoreCase(String name);

    List<Product> findByPriceBetween(double minPrice, double maxPrice);

    List<Product> findByQuantityGreaterThanEqual(int minQuantity);
    
    List<Product> findAllByOrderByNameAsc();

    List<Product> findAllByOrderByNameDesc();

    List<Product> findAllByOrderByPriceAsc();

    List<Product> findAllByOrderByPriceDesc();

    List<Product> findAllByOrderByQuantityAsc();

    List<Product> findAllByOrderByQuantityDesc();
}
