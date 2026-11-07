import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import axios from "axios";
import "./Layout.css";

function Layout() {
  const navigate = useNavigate();
  const location = useLocation();

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  const [products, setProducts] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      return;
    }

    axios
      .get("http://localhost:8080/api/products", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((response) => {
        const data = response.data.content || response.data;
        setProducts(data);
      })
      .catch((error) => {
        console.error("Notification products error:", error);
      });
  }, []);

  const logout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  const toggleSidebar = () => {
    setSidebarCollapsed((prev) => !prev);
  };

  const toggleNotifications = () => {
    setShowNotifications((prev) => !prev);
  };

  const toggleProfile = () => {
    setShowProfile((prev) => !prev);
  };

  // Create notifications from actual inventory data
  const lowStockProducts = products.filter(
    (product) =>
      Number(product.quantity) > 0 &&
      Number(product.quantity) <= 10
  );

  const outOfStockProducts = products.filter(
    (product) => Number(product.quantity) === 0
  );

  const notifications = [
    ...outOfStockProducts.map((product) => ({
      type: "danger",
      title: "Out of Stock",
      message: `${product.name} is out of stock.`,
    })),

    ...lowStockProducts.map((product) => ({
      type: "warning",
      title: "Low Stock",
      message: `${product.name} has only ${product.quantity} units left.`,
    })),
  ];

  const notificationCount = notifications.length;

  return (
    <div
      className={`app-layout ${
        sidebarCollapsed ? "sidebar-collapsed" : ""
      }`}
    >
      {/* SIDEBAR */}
      <aside className="sidebar">

        <div className="sidebar-logo">
          <div className="logo-icon">📦</div>

          <div className="logo-text">
            <h4>INVENTORY</h4>
            <span>MANAGEMENT</span>
          </div>
        </div>

        <div className="sidebar-menu">

          <Link
            to="/dashboard"
            className={`sidebar-link ${
              isActive("/dashboard") ? "active" : ""
            }`}
          >
            <span>⌂</span>
            <label>Dashboard</label>
          </Link>

          <Link
            to="/products"
            className={`sidebar-link ${
              isActive("/products") ? "active" : ""
            }`}
          >
            <span>▣</span>
            <label>Products</label>
          </Link>

          <Link
            to="/categories"
            className={`sidebar-link ${
              isActive("/categories") ? "active" : ""
            }`}
          >
            <span>◇</span>
            <label>Categories</label>
          </Link>

          <Link
            to="/suppliers"
            className={`sidebar-link ${
              isActive("/suppliers") ? "active" : ""
            }`}
          >
            <span>▱</span>
            <label>Suppliers</label>
          </Link>

          <Link
            to="/stock"
            className={`sidebar-link ${
              isActive("/stock") ? "active" : ""
            }`}
          >
            <span>▤</span>
            <label>Stock</label>
          </Link>

          <Link
            to="/reports"
            className={`sidebar-link ${
              isActive("/reports") ? "active" : ""
            }`}
          >
            <span>▥</span>
            <label>Reports</label>
          </Link>

        </div>

        <div className="sidebar-bottom">

          <button
            onClick={logout}
            className="logout-button"
          >
            <span>↪</span>
            <label>Logout</label>
          </button>

        </div>
      </aside>


      {/* MAIN AREA */}
      <div className="main-area">

        {/* TOP NAVBAR */}
        <nav className="top-navbar">

          <button
            className="menu-button"
            onClick={toggleSidebar}
            title={
              sidebarCollapsed
                ? "Expand sidebar"
                : "Collapse sidebar"
            }
          >
            ☰
          </button>


          <div className="top-navbar-right">

            {/* NOTIFICATIONS */}
            <div
              style={{
                position: "relative",
              }}
            >

              <button
                className="notification-button"
                onClick={toggleNotifications}
                title="Notifications"
              >
                🔔

                {notificationCount > 0 && (
                  <span>
                    {notificationCount > 9
                      ? "9+"
                      : notificationCount}
                  </span>
                )}
              </button>


              {showNotifications && (
                <div
                  style={{
                    position: "absolute",
                    top: "52px",
                    right: "0",
                    width: "340px",
                    background: "#ffffff",
                    border: "1px solid #e2e8f0",
                    borderRadius: "12px",
                    boxShadow:
                      "0 12px 35px rgba(0, 0, 0, 0.15)",
                    zIndex: 2000,
                    overflow: "hidden",
                  }}
                >

                  {/* HEADER */}
                  <div
                    style={{
                      padding: "16px 18px",
                      borderBottom:
                        "1px solid #e2e8f0",
                      display: "flex",
                      justifyContent:
                        "space-between",
                      alignItems: "center",
                    }}
                  >
                    <strong
                      style={{
                        fontSize: "15px",
                        color: "#1e293b",
                      }}
                    >
                      Notifications
                    </strong>

                    <span
                      style={{
                        fontSize: "12px",
                        color: "#64748b",
                      }}
                    >
                      {notificationCount} alert
                      {notificationCount !== 1
                        ? "s"
                        : ""}
                    </span>
                  </div>


                  {/* NOTIFICATION LIST */}
                  <div
                    style={{
                      maxHeight: "320px",
                      overflowY: "auto",
                    }}
                  >

                    {notifications.length === 0 ? (
                      <div
                        style={{
                          padding: "30px 20px",
                          textAlign: "center",
                          color: "#64748b",
                        }}
                      >
                        <div
                          style={{
                            fontSize: "30px",
                            marginBottom: "10px",
                          }}
                        >
                          ✓
                        </div>

                        <strong
                          style={{
                            display: "block",
                            color: "#334155",
                            marginBottom: "5px",
                          }}
                        >
                          All good!
                        </strong>

                        <span
                          style={{
                            fontSize: "13px",
                          }}
                        >
                          No inventory alerts.
                        </span>
                      </div>
                    ) : (
                      notifications.map(
                        (notification, index) => (
                          <div
                            key={index}
                            style={{
                              padding: "14px 18px",
                              borderBottom:
                                "1px solid #f1f5f9",
                              display: "flex",
                              gap: "12px",
                            }}
                          >

                            <div
                              style={{
                                width: "34px",
                                height: "34px",
                                borderRadius: "50%",
                                background:
                                  notification.type ===
                                  "danger"
                                    ? "#fee2e2"
                                    : "#fef3c7",
                                display: "flex",
                                alignItems:
                                  "center",
                                justifyContent:
                                  "center",
                                flexShrink: 0,
                              }}
                            >
                              {notification.type ===
                              "danger"
                                ? "!"
                                : "⚠"}
                            </div>

                            <div>
                              <strong
                                style={{
                                  display: "block",
                                  fontSize: "13px",
                                  color:
                                    "#1e293b",
                                  marginBottom:
                                    "3px",
                                }}
                              >
                                {notification.title}
                              </strong>

                              <span
                                style={{
                                  fontSize: "12px",
                                  color:
                                    "#64748b",
                                  lineHeight: "1.4",
                                }}
                              >
                                {notification.message}
                              </span>
                            </div>

                          </div>
                        )
                      )
                    )}

                  </div>


                  {/* FOOTER */}
                  <div
                    style={{
                      padding: "12px 18px",
                      borderTop:
                        "1px solid #e2e8f0",
                    }}
                  >
                    <button
                      onClick={() => {
                        setShowNotifications(false);
                        navigate("/stock");
                      }}
                      style={{
                        width: "100%",
                        border: "none",
                        background: "#eff6ff",
                        color: "#2563eb",
                        padding: "9px",
                        borderRadius: "7px",
                        fontSize: "13px",
                        fontWeight: "600",
                        cursor: "pointer",
                      }}
                    >
                      View Stock
                    </button>
                  </div>

                </div>
              )}

            </div>


            {/* USER PROFILE */}
<div
  style={{
    position: "relative",
  }}
>
  <button
    onClick={toggleProfile}
    style={{
      display: "flex",
      alignItems: "center",
      gap: "10px",
      border: "none",
      background: "transparent",
      cursor: "pointer",
      padding: "6px 8px",
      borderRadius: "8px",
    }}
    title="Admin Profile"
  >
    <div className="user-avatar">
      A
    </div>

    <div
      className="user-details"
      style={{
        textAlign: "left",
      }}
    >
      <strong>Admin</strong>
      <small>Administrator</small>
    </div>

    <span className="dropdown-arrow">
      ▼
    </span>
  </button>

  {showProfile && (
    <div
      style={{
        position: "absolute",
        top: "58px",
        right: "0",
        width: "230px",
        background: "#ffffff",
        border: "1px solid #e2e8f0",
        borderRadius: "12px",
        boxShadow:
          "0 12px 35px rgba(0, 0, 0, 0.15)",
        zIndex: 2000,
        overflow: "hidden",
      }}
    >

      {/* PROFILE HEADER */}
      <div
        style={{
          padding: "18px",
          borderBottom: "1px solid #e2e8f0",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
          }}
        >
          <div className="user-avatar">
            A
          </div>

          <div>
            <strong
              style={{
                display: "block",
                color: "#1e293b",
                fontSize: "14px",
              }}
            >
              Admin
            </strong>

            <span
              style={{
                color: "#64748b",
                fontSize: "12px",
              }}
            >
              Administrator
            </span>
          </div>
        </div>
      </div>

      {/* PROFILE OPTIONS */}
      <div style={{ padding: "8px" }}>

        <div
          style={{
            padding: "10px 12px",
            color: "#475569",
            fontSize: "13px",
          }}
        >
          👤 &nbsp; Administrator Account
        </div>

        <button
          onClick={() => {
            setShowProfile(false);
            logout();
          }}
          style={{
            width: "100%",
            border: "none",
            background: "transparent",
            textAlign: "left",
            padding: "10px 12px",
            borderRadius: "7px",
            color: "#dc2626",
            fontSize: "13px",
            fontWeight: "600",
            cursor: "pointer",
          }}
        >
          🚪 &nbsp; Logout
        </button>

      </div>

    </div>
  )}

</div>

          </div>
        </nav>


        {/* PAGE CONTENT */}
        <main className="page-content">
          <Outlet />
        </main>

      </div>
    </div>
  );
}

export default Layout;