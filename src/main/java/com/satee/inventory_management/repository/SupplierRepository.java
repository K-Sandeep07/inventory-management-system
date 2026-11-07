package com.satee.inventory_management.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.satee.inventory_management.entity.Supplier;

public interface SupplierRepository extends JpaRepository<Supplier, Long> {

}
