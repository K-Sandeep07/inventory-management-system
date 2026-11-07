package com.satee.inventory_management.dto;

public class StockTransactionResponseDTO {

    private Long id;
    private String type;
    private int quantity;
    private Long productId;
    private String productName;

    public StockTransactionResponseDTO() {
    }

    public StockTransactionResponseDTO(
            Long id,
            String type,
            int quantity,
            Long productId,
            String productName) {

        this.id = id;
        this.type = type;
        this.quantity = quantity;
        this.productId = productId;
        this.productName = productName;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public int getQuantity() {
        return quantity;
    }

    public void setQuantity(int quantity) {
        this.quantity = quantity;
    }

    public Long getProductId() {
        return productId;
    }

    public void setProductId(Long productId) {
        this.productId = productId;
    }

    public String getProductName() {
        return productName;
    }

    public void setProductName(String productName) {
        this.productName = productName;
    }
}