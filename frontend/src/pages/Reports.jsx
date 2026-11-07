import { useEffect, useState } from "react";
import "./Reports.css";

const PRODUCT_API_URL = "http://localhost:8080/api/products";
const CATEGORY_API_URL = "http://localhost:8080/api/categories";
const SUPPLIER_API_URL = "http://localhost:8080/api/suppliers";
const STOCK_API_URL = "http://localhost:8080/api/stock";

function Reports() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [transactions, setTransactions] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ==============================
  // FETCH ALL REPORT DATA
  // ==============================
  const fetchReportData = async () => {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("token");

      if (!token) {
        throw new Error("Please login again");
      }

      const headers = {
        Authorization: `Bearer ${token}`,
      };

      const [
        productsResponse,
        categoriesResponse,
        suppliersResponse,
        transactionsResponse,
      ] = await Promise.all([
        fetch(PRODUCT_API_URL, {
          headers,
        }),

        fetch(CATEGORY_API_URL, {
          headers,
        }),

        fetch(SUPPLIER_API_URL, {
          headers,
        }),

        fetch(`${STOCK_API_URL}/transactions`, {
          headers,
        }),
      ]);

      if (
        productsResponse.status === 401 ||
        productsResponse.status === 403 ||
        categoriesResponse.status === 401 ||
        categoriesResponse.status === 403 ||
        suppliersResponse.status === 401 ||
        suppliersResponse.status === 403 ||
        transactionsResponse.status === 401 ||
        transactionsResponse.status === 403
      ) {
        throw new Error(
          "You are not authorized to view reports"
        );
      }

      if (!productsResponse.ok) {
        throw new Error("Failed to fetch products");
      }

      if (!categoriesResponse.ok) {
        throw new Error("Failed to fetch categories");
      }

      if (!suppliersResponse.ok) {
        throw new Error("Failed to fetch suppliers");
      }

      if (!transactionsResponse.ok) {
        throw new Error(
          "Failed to fetch stock transactions"
        );
      }

      const productsData = await productsResponse.json();
      const categoriesData = await categoriesResponse.json();
      const suppliersData = await suppliersResponse.json();
      const transactionsData =
        await transactionsResponse.json();

      setProducts(productsData);
      setCategories(categoriesData);
      setSuppliers(suppliersData);
      setTransactions(transactionsData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportData();
  }, []);

  // ==============================
  // CALCULATIONS
  // ==============================

  const totalProducts = products.length;

  const totalCategories = categories.length;

  const totalSuppliers = suppliers.length;

  const totalQuantity = products.reduce(
    (total, product) => total + product.quantity,
    0
  );

  const totalInventoryValue = products.reduce(
    (total, product) =>
      total + product.price * product.quantity,
    0
  );

  const lowStockProducts = products.filter(
    (product) =>
      product.quantity > 0 &&
      product.quantity <= 5
  );

  const outOfStockProducts = products.filter(
    (product) => product.quantity === 0
  );

  const stockInTransactions = transactions.filter(
    (transaction) =>
      transaction.type === "STOCK_IN"
  );

  const stockOutTransactions = transactions.filter(
    (transaction) =>
      transaction.type === "STOCK_OUT"
  );

  const totalStockIn = stockInTransactions.reduce(
    (total, transaction) =>
      total + transaction.quantity,
    0
  );

  const totalStockOut = stockOutTransactions.reduce(
    (total, transaction) =>
      total + transaction.quantity,
    0
  );

  // ==============================
  // FORMAT CURRENCY
  // ==============================

  const formatCurrency = (value) => {
    return `₹${Number(value).toLocaleString("en-IN", {
      maximumFractionDigits: 2,
    })}`;
  };

  return (
    <div className="reports-page">

      {/* =========================
          HEADER
      ========================== */}
      <div className="reports-header">
        <div>
          <h1>Reports</h1>
          <p>
            Overview of your inventory management system
          </p>
        </div>

        <button
          className="refresh-btn"
          onClick={fetchReportData}
          disabled={loading}
        >
          {loading ? "Loading..." : "Refresh Reports"}
        </button>
      </div>

      {/* =========================
          ERROR
      ========================== */}
      {error && (
        <div className="report-message error">
          {error}
        </div>
      )}

      {loading ? (
        <div className="report-loading">
          Loading reports...
        </div>
      ) : (
        <>
          {/* =========================
              SUMMARY CARDS
          ========================== */}
          <div className="summary-grid">

            <div className="summary-card">
              <div className="summary-icon">
                📦
              </div>

              <div>
                <span className="summary-value">
                  {totalProducts}
                </span>

                <span className="summary-label">
                  Total Products
                </span>
              </div>
            </div>

            <div className="summary-card">
              <div className="summary-icon">
                🏷️
              </div>

              <div>
                <span className="summary-value">
                  {totalCategories}
                </span>

                <span className="summary-label">
                  Categories
                </span>
              </div>
            </div>

            <div className="summary-card">
              <div className="summary-icon">
                🚚
              </div>

              <div>
                <span className="summary-value">
                  {totalSuppliers}
                </span>

                <span className="summary-label">
                  Suppliers
                </span>
              </div>
            </div>

            <div className="summary-card">
              <div className="summary-icon">
                📊
              </div>

              <div>
                <span className="summary-value">
                  {totalQuantity}
                </span>

                <span className="summary-label">
                  Total Stock
                </span>
              </div>
            </div>

          </div>

          {/* =========================
              INVENTORY VALUE
          ========================== */}
          <div className="value-card">
            <div>
              <h2>Total Inventory Value</h2>
              <p>
                Current value based on product price × quantity
              </p>
            </div>

            <div className="inventory-value">
              {formatCurrency(totalInventoryValue)}
            </div>
          </div>

          {/* =========================
              STOCK TRANSACTION SUMMARY
          ========================== */}
          <div className="section-card">

            <div className="section-title">
              <div>
                <h2>Stock Movement</h2>
                <p>
                  Summary of stock transactions
                </p>
              </div>
            </div>

            <div className="movement-grid">

              <div className="movement-card stock-in-card">
                <span className="movement-icon">
                  📥
                </span>

                <div>
                  <span className="movement-title">
                    Stock In
                  </span>

                  <strong>
                    {totalStockIn}
                  </strong>

                  <small>
                    {stockInTransactions.length} transactions
                  </small>
                </div>
              </div>

              <div className="movement-card stock-out-card">
                <span className="movement-icon">
                  📤
                </span>

                <div>
                  <span className="movement-title">
                    Stock Out
                  </span>

                  <strong>
                    {totalStockOut}
                  </strong>

                  <small>
                    {stockOutTransactions.length} transactions
                  </small>
                </div>
              </div>

            </div>
          </div>

          {/* =========================
              STOCK ALERTS
          ========================== */}
          <div className="section-card">

            <div className="section-title">
              <div>
                <h2>Stock Alerts</h2>
                <p>
                  Products that may need attention
                </p>
              </div>
            </div>

            <div className="alert-grid">

              <div className="alert-card low-alert">
                <span className="alert-icon">
                  ⚠️
                </span>

                <div>
                  <strong>
                    {lowStockProducts.length}
                  </strong>

                  <span>
                    Low Stock Products
                  </span>
                </div>
              </div>

              <div className="alert-card out-alert">
                <span className="alert-icon">
                  ❌
                </span>

                <div>
                  <strong>
                    {outOfStockProducts.length}
                  </strong>

                  <span>
                    Out of Stock Products
                  </span>
                </div>
              </div>

            </div>
          </div>

          {/* =========================
              INVENTORY REPORT
          ========================== */}
          <div className="section-card">

            <div className="section-title">
              <div>
                <h2>Inventory Report</h2>
                <p>
                  Detailed product inventory information
                </p>
              </div>
            </div>

            {products.length === 0 ? (
              <div className="empty-report">
                No products found.
              </div>
            ) : (
              <div className="table-container">

                <table className="report-table">

                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Product</th>
                      <th>Category</th>
                      <th>Supplier</th>
                      <th>Price</th>
                      <th>Quantity</th>
                      <th>Status</th>
                    </tr>
                  </thead>

                  <tbody>

                    {products.map((product) => (
                      <tr key={product.id}>

                        <td>
                          {product.id}
                        </td>

                        <td className="product-name">
                          {product.name}
                        </td>

                        <td>
                          {product.categoryName ||
                            "N/A"}
                        </td>

                        <td>
                          {product.supplierName ||
                            "N/A"}
                        </td>

                        <td>
                          {formatCurrency(product.price)}
                        </td>

                        <td className="quantity-cell">
                          {product.quantity}
                        </td>

                        <td>
                          {product.quantity === 0 ? (
                            <span className="status out">
                              Out of Stock
                            </span>
                          ) : product.quantity <= 5 ? (
                            <span className="status low">
                              Low Stock
                            </span>
                          ) : (
                            <span className="status good">
                              In Stock
                            </span>
                          )}
                        </td>

                      </tr>
                    ))}

                  </tbody>

                </table>

              </div>
            )}
          </div>

          {/* =========================
              RECENT TRANSACTIONS
          ========================== */}
          <div className="section-card">

            <div className="section-title">
              <div>
                <h2>Recent Stock Transactions</h2>
                <p>
                  Latest inventory movements
                </p>
              </div>
            </div>

            {transactions.length === 0 ? (
              <div className="empty-report">
                No stock transactions found.
              </div>
            ) : (
              <div className="table-container">

                <table className="report-table">

                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Type</th>
                      <th>Product</th>
                      <th>Product ID</th>
                      <th>Quantity</th>
                    </tr>
                  </thead>

                  <tbody>

                    {[...transactions]
                      .reverse()
                      .slice(0, 10)
                      .map((transaction) => (
                        <tr key={transaction.id}>

                          <td>
                            {transaction.id}
                          </td>

                          <td>
                            {transaction.type ===
                            "STOCK_IN" ? (
                              <span className="transaction-in">
                                STOCK IN
                              </span>
                            ) : (
                              <span className="transaction-out">
                                STOCK OUT
                              </span>
                            )}
                          </td>

                          <td className="product-name">
                            {transaction.productName}
                          </td>

                          <td>
                            {transaction.productId}
                          </td>

                          <td className="quantity-cell">
                            {transaction.quantity}
                          </td>

                        </tr>
                      ))}

                  </tbody>

                </table>

              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default Reports;