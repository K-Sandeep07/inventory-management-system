import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./Dashboard.css";

const API_URL = "http://localhost:8080/api";

const getList = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.content)) return data.content;
  if (Array.isArray(data?.items)) return data.items;
  return [];
};

function Dashboard() {
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [selectedDate, setSelectedDate] = useState(
    new Date().toLocaleDateString("en-CA")
  );
  const [showCalendar, setShowCalendar] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      setErrorMessage("Your session has expired. Please log in again.");
      setLoading(false);
      return;
    }

    const headers = { Authorization: `Bearer ${token}` };

    const loadDashboard = async () => {
      setLoading(true);
      setErrorMessage("");

      try {
        const results = await Promise.allSettled([
          // Request a large page so dashboard totals are not limited to the default page.
          axios.get(`${API_URL}/products?page=0&size=1000`, { headers }),
          axios.get(`${API_URL}/categories`, { headers }),
          axios.get(`${API_URL}/suppliers`, { headers }),
        ]);

        const [productsResult, categoriesResult, suppliersResult] = results;
        let failedRequests = 0;

        if (productsResult.status === "fulfilled") {
          setProducts(getList(productsResult.value.data));
        } else {
          failedRequests += 1;
          console.error("Products error:", productsResult.reason);
        }

        if (categoriesResult.status === "fulfilled") {
          setCategories(getList(categoriesResult.value.data));
        } else {
          failedRequests += 1;
          console.error("Categories error:", categoriesResult.reason);
        }

        if (suppliersResult.status === "fulfilled") {
          setSuppliers(getList(suppliersResult.value.data));
        } else {
          failedRequests += 1;
          console.error("Suppliers error:", suppliersResult.reason);
        }

        if (failedRequests > 0) {
          setErrorMessage(
            "Some dashboard data could not be loaded. Check that the backend is running and your login is valid."
          );
        }
      } catch (error) {
        console.error("Dashboard loading error:", error);
        setErrorMessage("Could not load dashboard data. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  const totalStock = useMemo(
    () =>
      products.reduce(
        (total, product) => total + Math.max(0, Number(product.quantity) || 0),
        0
      ),
    [products]
  );

  const inventoryValue = useMemo(
    () =>
      products.reduce(
        (total, product) =>
          total +
          Math.max(0, Number(product.price) || 0) *
            Math.max(0, Number(product.quantity) || 0),
        0
      ),
    [products]
  );

  const inStock = products.filter((product) => Number(product.quantity) > 10).length;
  const lowStock = products.filter(
    (product) => Number(product.quantity) > 0 && Number(product.quantity) <= 10
  ).length;
  const outOfStock = products.filter(
    (product) => Number(product.quantity) <= 0
  ).length;

  const stockSegments = [
    { label: "In Stock", count: inStock, color: "#16a34a" },
    { label: "Low Stock", count: lowStock, color: "#f59e0b" },
    { label: "Out of Stock", count: outOfStock, color: "#ef4444" },
  ];
  const stockTotal = inStock + lowStock + outOfStock;
  const inStockPercent = stockTotal ? (inStock / stockTotal) * 100 : 0;
  const lowStockPercent = stockTotal ? (lowStock / stockTotal) * 100 : 0;
  const outOfStockPercent = stockTotal ? (outOfStock / stockTotal) * 100 : 0;

  const categoryCounts = useMemo(() => {
    const counts = new Map();

    products.forEach((product) => {
      const categoryName = product.categoryName || "Uncategorized";
      counts.set(categoryName, (counts.get(categoryName) || 0) + 1);
    });

    return Array.from(counts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
  }, [products]);

  const maxCategoryCount = Math.max(1, ...categoryCounts.map((item) => item.count));
  const recentProducts = [...products]
    .sort((a, b) => Number(b.id || 0) - Number(a.id || 0))
    .slice(0, 5);

  const formattedDate = new Date(`${selectedDate}T00:00:00`).toLocaleDateString(
    "en-IN",
    { day: "2-digit", month: "short", year: "numeric" }
  );
  const today = new Date().toLocaleDateString("en-CA");
  const dateLabel = selectedDate === today ? "Today" : formattedDate;

  const handleDateChange = (event) => {
    setSelectedDate(event.target.value);
    setShowCalendar(false);
  };

  const formatCurrency = (value) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(value);

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div>
          <h1>Dashboard</h1>
          <p>Overview of your inventory</p>
        </div>

        <div style={{ position: "relative", display: "inline-block" }}>
          <button
            type="button"
            className="date-button"
            onClick={() => setShowCalendar((previous) => !previous)}
          >
            📅 &nbsp; {dateLabel} <span>▼</span>
          </button>

          {showCalendar && (
            <div
              style={{
                position: "absolute",
                top: "52px",
                right: 0,
                background: "#ffffff",
                border: "1px solid #e2e8f0",
                borderRadius: "10px",
                padding: "14px",
                boxShadow: "0 10px 30px rgba(0, 0, 0, 0.12)",
                zIndex: 1000,
              }}
            >
              <label
                htmlFor="dashboard-date"
                style={{
                  display: "block",
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "#334155",
                  marginBottom: "8px",
                }}
              >
                Select Date
              </label>
              <input
                id="dashboard-date"
                type="date"
                value={selectedDate}
                onChange={handleDateChange}
                style={{
                  padding: "9px 10px",
                  border: "1px solid #cbd5e1",
                  borderRadius: "7px",
                  fontSize: "14px",
                  cursor: "pointer",
                }}
              />
            </div>
          )}
        </div>
      </div>

      {errorMessage && (
        <div
          role="alert"
          style={{
            padding: "12px 16px",
            marginBottom: "18px",
            borderRadius: "8px",
            background: "#fff7ed",
            color: "#9a3412",
            border: "1px solid #fed7aa",
          }}
        >
          {errorMessage}
        </div>
      )}

      {loading && (
        <p style={{ marginBottom: "16px", color: "#64748b" }}>
          Loading dashboard data...
        </p>
      )}

      <div className="row g-4 mb-4">
        <div className="col-md-6 col-xl-3">
          <div className="stat-card">
            <div className="stat-icon products-icon">📦</div>
            <div className="stat-content">
              <p>Total Products</p>
              <h2 className="products-number">{loading ? "—" : products.length}</h2>
              <span className="stat-link" onClick={() => navigate("/products")} style={{ cursor: "pointer" }}>
                All Products →
              </span>
            </div>
          </div>
        </div>

        <div className="col-md-6 col-xl-3">
          <div className="stat-card">
            <div className="stat-icon stock-icon">📊</div>
            <div className="stat-content">
              <p>Total Stock</p>
              <h2 className="stock-number">{loading ? "—" : totalStock.toLocaleString("en-IN")}</h2>
              <span className="stat-link" onClick={() => navigate("/stock")} style={{ cursor: "pointer" }}>
                All Quantity →
              </span>
            </div>
          </div>
        </div>

        <div className="col-md-6 col-xl-3">
          <div className="stat-card">
            <div className="stat-icon category-icon">🏷️</div>
            <div className="stat-content">
              <p>Categories</p>
              <h2 className="category-number">{loading ? "—" : categories.length}</h2>
              <span className="stat-link" onClick={() => navigate("/categories")} style={{ cursor: "pointer" }}>
                All Categories →
              </span>
            </div>
          </div>
        </div>

        <div className="col-md-6 col-xl-3">
          <div className="stat-card">
            <div className="stat-icon supplier-icon">🚚</div>
            <div className="stat-content">
              <p>Suppliers</p>
              <h2 className="supplier-number">{loading ? "—" : suppliers.length}</h2>
              <span className="stat-link" onClick={() => navigate("/suppliers")} style={{ cursor: "pointer" }}>
                All Suppliers →
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="row g-4 mb-4">
        <div className="col-lg-6">
          <div className="dashboard-card" style={{ height: "100%" }}>
            <div className="card-header-custom">
              <h4>Inventory Value</h4>
              <span aria-hidden="true">💰</span>
            </div>
            <h2 style={{ margin: "12px 0 6px", fontSize: "clamp(1.5rem, 3vw, 2rem)", fontWeight: 700 }}>
              {loading ? "—" : formatCurrency(inventoryValue)}
            </h2>
            <p style={{ color: "#64748b", margin: 0 }}>
              Estimated value of current stock (price × quantity)
            </p>
          </div>
        </div>

        <div className="col-lg-6">
          <div className="dashboard-card" style={{ height: "100%" }}>
            <div className="card-header-custom">
              <h4>Stock Overview</h4>
              <button type="button" onClick={() => navigate("/stock")}>View Details</button>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "24px", flexWrap: "wrap", paddingTop: "14px" }}>
              <div
                role="img"
                aria-label={`Stock status: ${inStock} in stock, ${lowStock} low stock, ${outOfStock} out of stock`}
                style={{
                  width: "150px",
                  height: "150px",
                  flex: "0 0 150px",
                  borderRadius: "50%",
                  background: `conic-gradient(#16a34a 0 ${inStockPercent}%, #f59e0b ${inStockPercent}% ${inStockPercent + lowStockPercent}%, #ef4444 ${inStockPercent + lowStockPercent}% 100%)`,
                  display: "grid",
                  placeItems: "center",
                }}
              >
                <div style={{ width: "92px", height: "92px", borderRadius: "50%", background: "#fff", display: "grid", placeContent: "center", textAlign: "center" }}>
                  <strong style={{ fontSize: "24px", lineHeight: 1.2 }}>{loading ? "—" : totalStock}</strong>
                  <small style={{ color: "#64748b" }}>Units</small>
                </div>
              </div>

              <div style={{ display: "grid", gap: "13px" }}>
                {stockSegments.map((segment) => (
                  <div key={segment.label} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: segment.color, display: "inline-block" }} />
                    <div>
                      <strong style={{ display: "block" }}>{segment.label}</strong>
                      <small style={{ color: "#64748b" }}>{segment.count} products</small>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="row g-4 mb-4">
        <div className="col-lg-6">
          <div className="dashboard-card" style={{ height: "100%" }}>
            <div className="card-header-custom">
              <h4>Products by Category</h4>
              <button type="button" onClick={() => navigate("/categories")}>View Categories</button>
            </div>

            {categoryCounts.length === 0 ? (
              <p style={{ color: "#64748b", paddingTop: "16px" }}>No product category data available yet.</p>
            ) : (
              <div style={{ display: "grid", gap: "16px", paddingTop: "18px" }}>
                {categoryCounts.map((item) => (
                  <div key={item.name}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", marginBottom: "6px" }}>
                      <span style={{ overflowWrap: "anywhere" }}>{item.name}</span>
                      <strong>{item.count}</strong>
                    </div>
                    <div style={{ height: "9px", background: "#e2e8f0", borderRadius: "999px", overflow: "hidden" }}>
                      <div
                        style={{
                          height: "100%",
                          width: `${(item.count / maxCategoryCount) * 100}%`,
                          background: "#6366f1",
                          borderRadius: "999px",
                          transition: "width 250ms ease",
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="col-lg-6">
          <div className="dashboard-card" style={{ height: "100%" }}>
            <div className="card-header-custom">
              <h4>Recent Products</h4>
              <button type="button" onClick={() => navigate("/products")}>View All</button>
            </div>

            <div className="recent-products">
              {recentProducts.map((product) => (
                <div className="recent-product" key={product.id}>
                  <div className="product-image">
                    {product.imageName ? (
                      <img
                        src={`http://localhost:8080/product-images/${product.imageName}`}
                        alt={product.name}
                        style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "8px" }}
                        onError={(event) => {
                          event.currentTarget.style.display = "none";
                        }}
                      />
                    ) : (
                      "📦"
                    )}
                  </div>
                  <div className="product-info">
                    <strong>{product.name}</strong>
                    <small>{product.categoryName || "Uncategorized"}</small>
                  </div>
                  <span
                    className={
                      Number(product.quantity) <= 0
                        ? "stock-badge danger"
                        : Number(product.quantity) <= 10
                        ? "stock-badge warning"
                        : "stock-badge success"
                    }
                  >
                    {Number(product.quantity) || 0} in stock
                  </span>
                </div>
              ))}

              {!loading && recentProducts.length === 0 && (
                <div className="empty-products">No products available</div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="welcome-banner">
        <div className="welcome-icon">👋</div>
        <div>
          <h3>Welcome back</h3>
          <p>Here's what's happening with your inventory today.</p>
        </div>
        <div className="welcome-boxes" aria-hidden="true">📦 📦 📦</div>
      </div>
    </div>
  );
}

export default Dashboard;
