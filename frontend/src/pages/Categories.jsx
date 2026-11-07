import { useEffect, useState } from "react";
import axios from "axios";
import "./Categories.css";

function Categories() {

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [search, setSearch] = useState("");

  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const [selectedCategory, setSelectedCategory] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  const [form, setForm] = useState({
    name: "",
    description: "",
  });


  // =========================
  // LOAD CATEGORIES
  // =========================

  const loadCategories = async () => {

    try {

      setLoading(true);

      const token = localStorage.getItem("token");

      const headers = {
        Authorization: `Bearer ${token}`,
      };

      const response = await axios.get(
        "http://localhost:8080/api/categories",
        { headers }
      );

      setCategories(
        response.data.content || response.data
      );

    } catch (error) {

      console.error("Loading categories error:", error);

      setErrorMessage(
        error.response?.data?.message ||
        "Failed to load categories"
      );

    } finally {

      setLoading(false);

    }

  };


  useEffect(() => {
    loadCategories();
  }, []);


  // =========================
  // FORM CHANGE
  // =========================

  const handleChange = (e) => {

    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });

  };


  // =========================
  // RESET FORM
  // =========================

  const resetForm = () => {

    setForm({
      name: "",
      description: "",
    });

    setEditingId(null);

  };


  // =========================
  // ADD CATEGORY
  // =========================

  const handleAdd = () => {

    resetForm();

    setMessage("");
    setErrorMessage("");

    setShowForm(true);

  };


  // =========================
  // EDIT CATEGORY
  // =========================

  const handleEdit = (category) => {

    setEditingId(category.id);

    setForm({
      name: category.name || "",
      description: category.description || "",
    });

    setMessage("");
    setErrorMessage("");

    setShowForm(true);

  };


  // =========================
  // ADD / UPDATE
  // =========================

  const handleSubmit = async (e) => {

    e.preventDefault();

    setMessage("");
    setErrorMessage("");

    try {

      const token = localStorage.getItem("token");

      const headers = {
        Authorization: `Bearer ${token}`,
      };

      const data = {
        name: form.name,
        description: form.description,
      };


      // UPDATE

      if (editingId !== null) {

        await axios.put(
          `http://localhost:8080/api/categories/${editingId}`,
          data,
          { headers }
        );

        setMessage(
          "Category updated successfully!"
        );

      }

      // ADD

      else {

        await axios.post(
          "http://localhost:8080/api/categories",
          data,
          { headers }
        );

        setMessage(
          "Category added successfully!"
        );

      }


      resetForm();

      setShowForm(false);

      await loadCategories();

    } catch (error) {

      console.error(
        "Save category error:",
        error
      );

      setErrorMessage(
        error.response?.data?.message ||
        "Failed to save category"
      );

    }

  };


  // =========================
  // DELETE
  // =========================

  const handleDelete = async (id) => {

    const confirmed = window.confirm(
      "Are you sure you want to delete this category?"
    );

    if (!confirmed) {
      return;
    }

    try {

      setMessage("");
      setErrorMessage("");

      const token = localStorage.getItem("token");

      await axios.delete(
        `http://localhost:8080/api/categories/${id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setMessage(
        "Category deleted successfully!"
      );

      await loadCategories();

    } catch (error) {

      console.error(
        "Delete category error:",
        error
      );

      setErrorMessage(
        error.response?.data?.message ||
        "Failed to delete category"
      );

    }

  };


  // =========================
  // VIEW
  // =========================

  const handleView = (category) => {

    setSelectedCategory(category);

    setShowDetails(true);

  };


  const closeDetails = () => {

    setSelectedCategory(null);

    setShowDetails(false);

  };


  // =========================
  // CLOSE FORM
  // =========================

  const closeForm = () => {

    setShowForm(false);

    resetForm();

  };


  // =========================
  // SEARCH
  // =========================

  const filteredCategories =
    categories.filter((category) => {

      const searchText =
        search.toLowerCase().trim();

      if (!searchText) {
        return true;
      }

      return (
        category.name
          ?.toLowerCase()
          .includes(searchText)

        ||

        category.description
          ?.toLowerCase()
          .includes(searchText)

        ||

        String(category.id)
          .includes(searchText)
      );

    });


  // =========================
  // PAGE
  // =========================

  return (

    <div className="categories-page">


      {/* HEADER */}

      <div className="categories-header">

        <div>

          <h1>Categories</h1>

          <p>
            Organize your inventory products
          </p>

        </div>


        <button
          className="add-category-button"
          onClick={handleAdd}
        >
          + Add Category
        </button>

      </div>


      {/* SUCCESS */}

      {message && (

        <div className="alert alert-success">

          {message}

        </div>

      )}


      {/* ERROR */}

      {errorMessage && (

        <div className="alert alert-danger">

          {errorMessage}

        </div>

      )}


      {/* ADD / EDIT FORM */}

      {showForm && (

        <div className="categories-card category-form-card">

          <div className="form-header">

            <div>

              <h4>

                {editingId !== null
                  ? "Edit Category"
                  : "Add New Category"}

              </h4>

              <p>

                {editingId !== null
                  ? "Update category details."
                  : "Enter the category details below."}

              </p>

            </div>


            <button
              type="button"
              className="close-button"
              onClick={closeForm}
            >
              ✕
            </button>

          </div>


          <form onSubmit={handleSubmit}>

            <div className="row g-3">


              {/* NAME */}

              <div className="col-md-5">

                <label className="form-label">
                  Category Name
                </label>

                <input
                  type="text"
                  name="name"
                  className="form-control"
                  placeholder="Enter category name"
                  value={form.name}
                  onChange={handleChange}
                  required
                />

              </div>


              {/* DESCRIPTION */}

              <div className="col-md-7">

                <label className="form-label">
                  Description
                </label>

                <input
                  type="text"
                  name="description"
                  className="form-control"
                  placeholder="Enter category description"
                  value={form.description}
                  onChange={handleChange}
                />

              </div>

            </div>


            <div className="form-buttons">

              <button
                type="button"
                className="cancel-button"
                onClick={closeForm}
              >
                Cancel
              </button>


              <button
                type="submit"
                className="save-category-button"
              >

                {editingId !== null
                  ? "Update Category"
                  : "Save Category"}

              </button>

            </div>

          </form>

        </div>

      )}


      {/* CATEGORY TABLE */}

      <div className="categories-card">


        <div className="categories-card-header">

          <div>

            <h4>All Categories</h4>

            <span>
              {filteredCategories.length} categories
            </span>

          </div>


          <input
            type="text"
            className="category-search"
            placeholder="Search categories..."
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
          />

        </div>


        <div className="table-responsive">

          <table className="table categories-table">

            <thead>

              <tr>

                <th>Category</th>

                <th>Description</th>

                <th>ID</th>

                <th>Actions</th>

              </tr>

            </thead>


            <tbody>


              {loading ? (

                <tr>

                  <td
                    colSpan="4"
                    className="text-center py-5"
                  >
                    Loading categories...
                  </td>

                </tr>

              ) : filteredCategories.length === 0 ? (

                <tr>

                  <td
                    colSpan="4"
                    className="text-center py-5"
                  >

                    {search
                      ? "No categories match your search"
                      : "No categories found"}

                  </td>

                </tr>

              ) : (

                filteredCategories.map(
                  (category) => (

                    <tr key={category.id}>


                      <td>

                        <div className="category-cell">

                          <div className="category-icon">
                            ◇
                          </div>

                          <strong>
                            {category.name}
                          </strong>

                        </div>

                      </td>


                      <td>

                        {category.description ||
                          "No description"}

                      </td>


                      <td>

                        #{category.id}

                      </td>


                      <td>

                        <div className="action-buttons">


                          {/* VIEW */}

                          <button
                            type="button"
                            className="view-button"
                            title="View Category"
                            onClick={() =>
                              handleView(category)
                            }
                          >
                            👁️
                          </button>


                          {/* EDIT */}

                          <button
                            type="button"
                            className="edit-button"
                            title="Edit Category"
                            onClick={() =>
                              handleEdit(category)
                            }
                          >
                            ✏️
                          </button>


                          {/* DELETE */}

                          <button
                            type="button"
                            className="delete-button"
                            title="Delete Category"
                            onClick={() =>
                              handleDelete(
                                category.id
                              )
                            }
                          >
                            🗑️
                          </button>

                        </div>

                      </td>

                    </tr>

                  )
                )

              )}

            </tbody>

          </table>

        </div>

      </div>


      {/* VIEW MODAL */}

      {showDetails &&
        selectedCategory && (

          <div
            className="category-modal-overlay"
            onClick={closeDetails}
          >

            <div
              className="category-modal"
              onClick={(e) =>
                e.stopPropagation()
              }
            >

              <div className="category-modal-header">

                <div>

                  <h3>
                    Category Details
                  </h3>

                  <p>
                    Category ID: #
                    {selectedCategory.id}
                  </p>

                </div>


                <button
                  type="button"
                  className="close-button"
                  onClick={closeDetails}
                >
                  ✕
                </button>

              </div>


              <div className="category-details">

                <div className="detail-item">

                  <span>
                    Category Name
                  </span>

                  <strong>
                    {selectedCategory.name}
                  </strong>

                </div>


                <div className="detail-item">

                  <span>
                    Description
                  </span>

                  <strong>
                    {selectedCategory.description ||
                      "No description"}
                  </strong>

                </div>

              </div>


              <div className="category-modal-footer">

                <button
                  type="button"
                  className="cancel-button"
                  onClick={closeDetails}
                >
                  Close
                </button>

              </div>

            </div>

          </div>

        )}

    </div>

  );

}

export default Categories;