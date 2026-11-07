import { useEffect, useState } from "react";
import "./Suppliers.css";

const API_URL = "http://localhost:8080/api/suppliers";

function Suppliers() {
  const [suppliers, setSuppliers] = useState([]);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
  });

  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // ==============================
  // GET ALL SUPPLIERS
  // ==============================
  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("token");

      if (!token) {
        throw new Error("Please login again");
      }

      const response = await fetch(API_URL, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          throw new Error("You are not authorized to view suppliers");
        }

        throw new Error("Failed to fetch suppliers");
      }

      const data = await response.json();

      setSuppliers(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Load suppliers when page opens
  useEffect(() => {
    fetchSuppliers();
  }, []);

  // ==============================
  // HANDLE INPUT CHANGE
  // ==============================
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // ==============================
  // ADD / UPDATE SUPPLIER
  // ==============================
  const handleSubmit = async (e) => {
    e.preventDefault();

    setMessage("");
    setError("");

    try {
      const token = localStorage.getItem("token");

      if (!token) {
        throw new Error("Please login again");
      }

      const url = editingId
        ? `${API_URL}/${editingId}`
        : API_URL;

      const method = editingId ? "PUT" : "POST";

      const response = await fetch(url, {
        method: method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);

        if (response.status === 401 || response.status === 403) {
          throw new Error(
            "You are not authorized. Admin access is required."
          );
        }

        throw new Error(
          errorData?.message || "Failed to save supplier"
        );
      }

      setMessage(
        editingId
          ? "Supplier updated successfully"
          : "Supplier added successfully"
      );

      resetForm();

      // Refresh supplier list
      fetchSuppliers();
    } catch (err) {
      setError(err.message);
    }
  };

  // ==============================
  // EDIT SUPPLIER
  // ==============================
  const handleEdit = (supplier) => {
    setEditingId(supplier.id);

    setFormData({
      name: supplier.name || "",
      email: supplier.email || "",
      phone: supplier.phone || "",
      address: supplier.address || "",
    });

    setMessage("");
    setError("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // ==============================
  // DELETE SUPPLIER
  // ==============================
  const handleDelete = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this supplier?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setMessage("");
      setError("");

      const token = localStorage.getItem("token");

      if (!token) {
        throw new Error("Please login again");
      }

      const response = await fetch(`${API_URL}/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);

        if (response.status === 401 || response.status === 403) {
          throw new Error(
            "You are not authorized. Admin access is required."
          );
        }

        throw new Error(
          errorData?.message || "Failed to delete supplier"
        );
      }

      setMessage("Supplier deleted successfully");

      // Refresh supplier list
      fetchSuppliers();
    } catch (err) {
      setError(err.message);
    }
  };

  // ==============================
  // RESET FORM
  // ==============================
  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      phone: "",
      address: "",
    });

    setEditingId(null);
  };

  // ==============================
  // UI
  // ==============================
  return (
    <div className="suppliers-page">

      {/* =========================
          PAGE HEADER
      ========================== */}
      <div className="suppliers-header">
        <div>
          <h1>Suppliers</h1>
          <p>Manage your product suppliers</p>
        </div>

        <div className="supplier-count">
          <span>{suppliers.length}</span>
          <small>Total Suppliers</small>
        </div>
      </div>

      {/* =========================
          SUCCESS MESSAGE
      ========================== */}
      {message && (
        <div className="supplier-message success">
          {message}
        </div>
      )}

      {/* =========================
          ERROR MESSAGE
      ========================== */}
      {error && (
        <div className="supplier-message error">
          {error}
        </div>
      )}

      {/* =========================
          ADD / EDIT SUPPLIER FORM
      ========================== */}
      <div className="supplier-card">

        <div className="card-title">
          <h2>
            {editingId
              ? "Edit Supplier"
              : "Add New Supplier"}
          </h2>

          {editingId && (
            <button
              type="button"
              className="cancel-btn"
              onClick={resetForm}
            >
              Cancel
            </button>
          )}
        </div>

        <form
          className="supplier-form"
          onSubmit={handleSubmit}
        >

          {/* Supplier Name */}
          <div className="form-group">
            <label>Supplier Name</label>

            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter supplier name"
              required
            />
          </div>

          {/* Email */}
          <div className="form-group">
            <label>Email</label>

            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter email address"
              required
            />
          </div>

          {/* Phone */}
          <div className="form-group">
            <label>Phone</label>

            <input
              type="text"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="Enter phone number"
              required
            />
          </div>

          {/* Address */}
          <div className="form-group">
            <label>Address</label>

            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="Enter supplier address"
              required
            />
          </div>

          {/* Buttons */}
          <div className="form-actions">

            <button
              type="submit"
              className="save-btn"
            >
              {editingId
                ? "Update Supplier"
                : "Add Supplier"}
            </button>

            {editingId && (
              <button
                type="button"
                className="cancel-btn"
                onClick={resetForm}
              >
                Cancel
              </button>
            )}

          </div>
        </form>
      </div>

      {/* =========================
          SUPPLIER LIST
      ========================== */}
      <div className="supplier-card">

        <div className="card-title">
          <h2>Supplier List</h2>
        </div>

        {/* Loading */}
        {loading ? (
          <div className="loading">
            Loading suppliers...
          </div>

        ) : suppliers.length === 0 ? (

          /* Empty */
          <div className="empty-state">
            No suppliers found.
          </div>

        ) : (

          /* Table */
          <div className="table-container">

            <table className="supplier-table">

              <thead>
                <tr>
                  <th>ID</th>
                  <th>Supplier Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Address</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>

                {suppliers.map((supplier) => (
                  <tr key={supplier.id}>

                    <td>
                      {supplier.id}
                    </td>

                    <td className="supplier-name">
                      {supplier.name}
                    </td>

                    <td>
                      {supplier.email}
                    </td>

                    <td>
                      {supplier.phone}
                    </td>

                    <td>
                      {supplier.address}
                    </td>

                    <td className="actions">

                      <button
                        className="edit-btn"
                        onClick={() =>
                          handleEdit(supplier)
                        }
                      >
                        Edit
                      </button>

                      <button
                        className="delete-btn"
                        onClick={() =>
                          handleDelete(supplier.id)
                        }
                      >
                        Delete
                      </button>

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

export default Suppliers;