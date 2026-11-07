import { useEffect, useState } from "react";
import "./Stock.css";

const PRODUCT_API_URL = "http://localhost:8080/api/products";
const STOCK_API_URL = "http://localhost:8080/api/stock";

function Stock() {
  const [products, setProducts] = useState([]);
  const [transactions, setTransactions] = useState([]);

  const [selectedProduct, setSelectedProduct] = useState("");
  const [quantity, setQuantity] = useState("");
  const [transactionType, setTransactionType] = useState("STOCK_IN");

  const [loadingProducts, setLoadingProducts] = useState(false);
  const [loadingTransactions, setLoadingTransactions] = useState(false);
  const [processing, setProcessing] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // ==============================
  // GET PRODUCTS
  // ==============================
  const fetchProducts = async () => {
    try {
      setLoadingProducts(true);

      const token = localStorage.getItem("token");

      if (!token) {
        throw new Error("Please login again");
      }

      const response = await fetch(PRODUCT_API_URL, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          throw new Error(
            "You are not authorized to view products"
          );
        }

        throw new Error("Failed to fetch products");
      }

      const data = await response.json();

      setProducts(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingProducts(false);
    }
  };

  // ==============================
  // GET STOCK TRANSACTIONS
  // ==============================
  const fetchTransactions = async () => {
    try {
      setLoadingTransactions(true);

      const token = localStorage.getItem("token");

      if (!token) {
        throw new Error("Please login again");
      }

      const response = await fetch(
        `${STOCK_API_URL}/transactions`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          throw new Error(
            "You are not authorized to view stock transactions"
          );
        }

        throw new Error(
          "Failed to fetch stock transactions"
        );
      }

      const data = await response.json();

      setTransactions(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingTransactions(false);
    }
  };

  // ==============================
  // LOAD DATA
  // ==============================
  useEffect(() => {
    fetchProducts();
    fetchTransactions();
  }, []);

  // ==============================
  // HANDLE STOCK IN / OUT
  // ==============================
  const handleStockTransaction = async (e) => {
    e.preventDefault();

    setMessage("");
    setError("");

    if (!selectedProduct) {
      setError("Please select a product");
      return;
    }

    if (!quantity || Number(quantity) <= 0) {
      setError("Quantity must be greater than 0");
      return;
    }

    try {
      setProcessing(true);

      const token = localStorage.getItem("token");

      if (!token) {
        throw new Error("Please login again");
      }

      const endpoint =
        transactionType === "STOCK_IN"
          ? `${STOCK_API_URL}/in`
          : `${STOCK_API_URL}/out`;

      const url = `${endpoint}?productId=${selectedProduct}&quantity=${quantity}`;

      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => null);

        if (response.status === 401 || response.status === 403) {
          throw new Error(
            "You are not authorized. Admin access is required."
          );
        }

        throw new Error(
          errorData?.message ||
            "Stock transaction failed"
        );
      }

      const data = await response.json();

      if (transactionType === "STOCK_IN") {
        setMessage(
          `Stock added successfully. ${data.productName}: +${data.quantity}`
        );
      } else {
        setMessage(
          `Stock removed successfully. ${data.productName}: -${data.quantity}`
        );
      }

      // Reset quantity
      setQuantity("");

      // Refresh products so current quantities update
      await fetchProducts();

      // Refresh transactions
      await fetchTransactions();
    } catch (err) {
      setError(err.message);
    } finally {
      setProcessing(false);
    }
  };

  // ==============================
  // CLEAR FORM
  // ==============================
  const handleClear = () => {
    setSelectedProduct("");
    setQuantity("");
    setTransactionType("STOCK_IN");
    setMessage("");
    setError("");
  };

  return (
    <div className="stock-page">

      {/* =========================
          PAGE HEADER
      ========================== */}
      <div className="stock-header">
        <div>
          <h1>Stock Management</h1>
          <p>
            Manage stock in, stock out and inventory
            transactions
          </p>
        </div>

        <div className="stock-count">
          <span>{products.length}</span>
          <small>Total Products</small>
        </div>
      </div>

      {/* =========================
          SUCCESS MESSAGE
      ========================== */}
      {message && (
        <div className="stock-message success">
          {message}
        </div>
      )}

      {/* =========================
          ERROR MESSAGE
      ========================== */}
      {error && (
        <div className="stock-message error">
          {error}
        </div>
      )}

      {/* =========================
          STOCK TRANSACTION FORM
      ========================== */}
      <div className="stock-card">

        <div className="card-title">
          <div>
            <h2>Manage Stock</h2>
            <p>
              Add or remove stock from your products
            </p>
          </div>
        </div>

        <form
          className="stock-form"
          onSubmit={handleStockTransaction}
        >

          {/* Transaction Type */}
          <div className="form-group">
            <label>Transaction Type</label>

            <select
              value={transactionType}
              onChange={(e) =>
                setTransactionType(e.target.value)
              }
            >
              <option value="STOCK_IN">
                Stock In
              </option>

              <option value="STOCK_OUT">
                Stock Out
              </option>
            </select>
          </div>

          {/* Product */}
          <div className="form-group">
            <label>Product</label>

            <select
              value={selectedProduct}
              onChange={(e) =>
                setSelectedProduct(e.target.value)
              }
              required
            >
              <option value="">
                {loadingProducts
                  ? "Loading products..."
                  : "Select Product"}
              </option>

              {products.map((product) => (
                <option
                  key={product.id}
                  value={product.id}
                >
                  {product.name} — Current Stock:{" "}
                  {product.quantity}
                </option>
              ))}
            </select>
          </div>

          {/* Quantity */}
          <div className="form-group">
            <label>Quantity</label>

            <input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) =>
                setQuantity(e.target.value)
              }
              placeholder="Enter quantity"
              required
            />
          </div>

          {/* Buttons */}
          <div className="form-actions">

            <button
              type="submit"
              className={
                transactionType === "STOCK_IN"
                  ? "stock-in-btn"
                  : "stock-out-btn"
              }
              disabled={processing}
            >
              {processing
                ? "Processing..."
                : transactionType === "STOCK_IN"
                ? "Add Stock"
                : "Remove Stock"}
            </button>

            <button
              type="button"
              className="clear-btn"
              onClick={handleClear}
              disabled={processing}
            >
              Clear
            </button>

          </div>
        </form>
      </div>

      {/* =========================
          CURRENT STOCK
      ========================== */}
      <div className="stock-card">

        <div className="card-title">
          <div>
            <h2>Current Stock</h2>
            <p>
              Current quantity available for each product
            </p>
          </div>
        </div>

        {loadingProducts ? (
          <div className="loading">
            Loading products...
          </div>
        ) : products.length === 0 ? (
          <div className="empty-state">
            No products found.
          </div>
        ) : (
          <div className="table-container">

            <table className="stock-table">

              <thead>
                <tr>
                  <th>ID</th>
                  <th>Product</th>
                  <th>Price</th>
                  <th>Current Quantity</th>
                  <th>Stock Status</th>
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
                      ₹{Number(product.price).toLocaleString("en-IN")}
                    </td>

                    <td className="quantity">
                      {product.quantity}
                    </td>

                    <td>
                      {product.quantity === 0 ? (
                        <span className="status out-of-stock">
                          Out of Stock
                        </span>
                      ) : product.quantity <= 5 ? (
                        <span className="status low-stock">
                          Low Stock
                        </span>
                      ) : (
                        <span className="status in-stock">
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
          TRANSACTION HISTORY
      ========================== */}
      <div className="stock-card">

        <div className="card-title">
          <div>
            <h2>Transaction History</h2>
            <p>
              Complete history of stock movements
            </p>
          </div>
        </div>

        {loadingTransactions ? (
          <div className="loading">
            Loading transactions...
          </div>
        ) : transactions.length === 0 ? (
          <div className="empty-state">
            No stock transactions found.
          </div>
        ) : (
          <div className="table-container">

            <table className="transaction-table">

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
                {transactions.map((transaction) => (
                  <tr key={transaction.id}>

                    <td>
                      {transaction.id}
                    </td>

                    <td>
                      {transaction.type === "STOCK_IN" ? (
                        <span className="transaction-badge stock-in">
                          STOCK IN
                        </span>
                      ) : (
                        <span className="transaction-badge stock-out">
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

                    <td className="quantity">
                      {transaction.quantity}
                    </td>

                  </tr>
                ))}
              </tbody>

            </table>

          </div>
        )}
      </div>

    </div>
  );
}

export default Stock;