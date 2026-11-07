

import { useEffect, useRef, useState } from "react";

import axios from "axios";

import "./Products.css";
import "./ProductsTools.css";



const API_URL = "http://localhost:8080/api";

const PRODUCTS_URL = `${API_URL}/products`;

const MAX_CSV_SIZE = 5 * 1024 * 1024;



const EMPTY_FORM = {

  name: "",

  price: "",

  quantity: "",

  categoryId: "",

  supplierId: "",

  imageUrl: "",

};



function Products() {

  // =========================

  // STATE

  // =========================

  const [products, setProducts] = useState([]);

  const [categories, setCategories] = useState([]);

  const [suppliers, setSuppliers] = useState([]);


  const [loading, setLoading] = useState(true);

  const [fetchingAutoImages, setFetchingAutoImages] = useState(false);


  const [saving, setSaving] = useState(false);



  const [showForm, setShowForm] = useState(false);

  const [editingId, setEditingId] = useState(null);

  const [autoImageResult, setAutoImageResult] = useState(null);



  const [search, setSearch] = useState("");

  const [message, setMessage] = useState("");

  const [errorMessage, setErrorMessage] = useState("");



  const [selectedProduct, setSelectedProduct] = useState(null);

  const [showDetails, setShowDetails] = useState(false);



  // Bulk CSV import state

  const [csvFile, setCsvFile] = useState(null);

  const [importingCsv, setImportingCsv] = useState(false);

  const [importErrors, setImportErrors] = useState([]);

  const csvInputRef = useRef(null);



  const [form, setForm] = useState(EMPTY_FORM);



  // Bulk product image upload state








  // =========================

  // AUTHENTICATION HEADERS

  // =========================

  const getHeaders = () => {

    const token = localStorage.getItem("token");



    return {

      Authorization: `Bearer ${token}`,

    };

  };



  // =========================

  // LOAD DATA

  // =========================

  const loadData = async () => {

    try {

      setLoading(true);



      const headers = getHeaders();



      const [

        productsResponse,

        categoriesResponse,

        suppliersResponse,

      ] = await Promise.all([

        axios.get(PRODUCTS_URL, { headers }),

        axios.get(`${API_URL}/categories`, { headers }),

        axios.get(`${API_URL}/suppliers`, { headers }),

      ]);



      // Products API supports pagination

      const productData = productsResponse.data;



      setProducts(

        Array.isArray(productData)

          ? productData

          : productData.content || []

      );



      setCategories(

        Array.isArray(categoriesResponse.data)

          ? categoriesResponse.data

          : categoriesResponse.data.content || []

      );



      setSuppliers(

        Array.isArray(suppliersResponse.data)

          ? suppliersResponse.data

          : suppliersResponse.data.content || []

      );

    } catch (error) {

      console.error("Loading error:", error);



      setErrorMessage(

        error.response?.data?.message ||

          "Failed to load products. Check your login and backend."

      );

    } finally {

      setLoading(false);

    }

  };



  // =========================

  // INITIAL LOAD

  // =========================

  useEffect(() => {

    loadData();

  }, []);



  // =========================

  // FORM CHANGE

  // =========================

  const handleChange = (e) => {

    const { name, value } = e.target;



    setForm((currentForm) => ({

      ...currentForm,

      [name]: value,

    }));

  };



  // =========================

  // RESET FORM

  // =========================

  const resetForm = () => {

    setForm({ ...EMPTY_FORM });

    setEditingId(null);

  };



  // =========================

  // OPEN ADD FORM

  // =========================

  const handleAddProduct = () => {

    resetForm();

    setMessage("");

    setErrorMessage("");

    setShowForm(true);

  };



  // =========================

  // OPEN EDIT FORM

  // =========================

  const handleEdit = (product) => {

    setEditingId(product.id);



    setForm({

      name: product.name || "",

      price: product.price ?? "",

      quantity: product.quantity ?? "",

      categoryId: product.categoryId ?? "",

      supplierId: product.supplierId ?? "",

      imageUrl: "",

    });



    setMessage("");

    setErrorMessage("");

    setShowForm(true);

  };



  // =========================

  // ADD / UPDATE PRODUCT

  // =========================

  const handleSubmit = async (e) => {

    e.preventDefault();



    setMessage("");

    setErrorMessage("");



    const price = Number(form.price);

    const quantity = Number(form.quantity);



    if (!form.name.trim()) {

      setErrorMessage("Product name is required.");

      return;

    }



    if (!Number.isFinite(price) || price < 0) {

      setErrorMessage("Price must be a valid non-negative number.");

      return;

    }



    if (!Number.isInteger(quantity) || quantity < 0) {

      setErrorMessage("Quantity must be a non-negative whole number.");

      return;

    }



    setSaving(true);



    try {

      const headers = getHeaders();



      const productData = {

        name: form.name.trim(),

        price,

        quantity,

        categoryId: form.categoryId

          ? Number(form.categoryId)

          : null,

        supplierId: form.supplierId

          ? Number(form.supplierId)

          : null,

      };



      let savedProductId = editingId;



      if (editingId !== null) {

        const response = await axios.put(

          `${PRODUCTS_URL}/${editingId}`,

          productData,

          { headers }

        );



        savedProductId = response.data.id ?? editingId;

      } else {

        const response = await axios.post(

          PRODUCTS_URL,

          productData,

          { headers }

        );



        savedProductId = response.data.id;

      }



      // Save image from URL when provided

      if (form.imageUrl.trim()) {

        if (!savedProductId) {

          throw new Error(

            "Product was saved, but its ID was not returned for image processing."

          );

        }



        await axios.post(

          `${PRODUCTS_URL}/${savedProductId}/image-url`,

          null,

          {

            params: {

              url: form.imageUrl.trim(),

            },

            headers,

          }

        );

      }



      setMessage(

        editingId !== null

          ? "Product updated successfully!"

          : "Product added successfully!"

      );



      resetForm();

      setShowForm(false);



      await loadData();

    } catch (error) {

      console.error("Save product error:", error);



      setErrorMessage(

        error.response?.data?.message ||

          error.message ||

          "Failed to save product. Check the image URL and backend."

      );

    } finally {

      setSaving(false);

    }

  };



  // =========================

  // DELETE PRODUCT

  // =========================

  const handleDelete = async (id) => {

    const confirmed = window.confirm(

      "Are you sure you want to delete this product?"

    );



    if (!confirmed) return;



    try {

      setMessage("");

      setErrorMessage("");



      await axios.delete(`${PRODUCTS_URL}/${id}`, {

        headers: getHeaders(),

      });



      setMessage("Product deleted successfully!");



      if (selectedProduct?.id === id) {

        setSelectedProduct(null);

        setShowDetails(false);

      }



      await loadData();

    } catch (error) {

      console.error("Delete product error:", error);



      setErrorMessage(

        error.response?.data?.message ||

          "Failed to delete product."

      );

    }

  };



  // =========================

  // VIEW PRODUCT

  // =========================

  const handleView = (product) => {

    setSelectedProduct(product);

    setShowDetails(true);

  };



  // =========================

  // CLOSE DETAILS

  // =========================

  const closeDetails = () => {

    setSelectedProduct(null);

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

  // CSV FILE SELECTION

  // =========================

  const handleCsvFileChange = (e) => {

    const file = e.target.files?.[0] || null;



    setCsvFile(file);

    setImportErrors([]);

    setMessage("");

    setErrorMessage("");



    if (!file) return;



    if (!file.name.toLowerCase().endsWith(".csv")) {

      setErrorMessage("Please select a CSV file with a .csv extension.");

      setCsvFile(null);

      e.target.value = "";

      return;

    }



    if (file.size > MAX_CSV_SIZE) {

      setErrorMessage("CSV file size must not exceed 5 MB.");

      setCsvFile(null);

      e.target.value = "";

    }

  };



  // =========================

  // BULK IMPORT PRODUCTS

  // =========================

  const handleCsvImport = async () => {

    setMessage("");

    setErrorMessage("");

    setImportErrors([]);



    if (!csvFile) {

      setErrorMessage("Please choose a CSV file before importing.");

      return;

    }



    if (!csvFile.name.toLowerCase().endsWith(".csv")) {

      setErrorMessage("Please select a valid .csv file.");

      return;

    }



    if (csvFile.size > MAX_CSV_SIZE) {

      setErrorMessage("CSV file size must not exceed 5 MB.");

      return;

    }



    const confirmed = window.confirm(

      "Import products from this CSV file? Importing the same file again may create duplicate products."

    );



    if (!confirmed) return;



    setImportingCsv(true);



    try {

      const formData = new FormData();

      formData.append("file", csvFile);



      // Do not manually set Content-Type.

      // Axios will set the multipart/form-data boundary.

      const response = await axios.post(

        `${PRODUCTS_URL}/import-csv`,

        formData,

        {

          headers: getHeaders(),

        }

      );



      const result = response.data || {};



      const successCount = Number(result.successCount ?? 0);

      const failureCount = Number(result.failureCount ?? 0);



      setMessage(

        `CSV import completed: ${successCount} product(s) imported successfully; ${failureCount} row(s) failed.`

      );



      setImportErrors(

        Array.isArray(result.errors) ? result.errors : []

      );



      setCsvFile(null);



      if (csvInputRef.current) {

        csvInputRef.current.value = "";

      }



      await loadData();

    } catch (error) {

      console.error("CSV import error:", error);



      setErrorMessage(

        error.response?.data?.message ||

          error.response?.data?.detail ||

          error.response?.data?.error ||

          "CSV import failed. Check the CSV format, authentication, and backend."

      );

    } finally {

      setImportingCsv(false);

    }

  };



    // =========================
  // AUTOMATIC PRODUCT IMAGE SEARCH
  // =========================
  const handleAutoFetchImages = async () => {
    const missingImages = products.filter(
      (product) => !product.imageName || !product.imageName.trim()
    ).length;

    if (missingImages === 0) {
      setMessage("All products already have images.");
      setErrorMessage("");
      return;
    }

    const confirmed = window.confirm(
      `Search the internet for images for up to ${Math.min(missingImages, 100)} products without images? Existing product images will be preserved.`
    );
    if (!confirmed) return;

    setFetchingAutoImages(true);
    setAutoImageResult(null);
    setMessage("");
    setErrorMessage("");

    try {
      const response = await axios.post(`${PRODUCTS_URL}/images/auto-fetch`, null, {
        params: { limit: 100 },
        headers: getHeaders(),
        timeout: 300000,
      });
      setAutoImageResult(response.data || {});
      setMessage(
        `Automatic image search finished: ${response.data?.successCount ?? 0} images saved, ${response.data?.failureCount ?? 0} failed, ${response.data?.skippedCount ?? 0} already had images.`
      );
      await loadData();
    } catch (error) {
      console.error("Automatic image search error:", error);
      setErrorMessage(
        error.response?.data?.message ||
        error.response?.data?.detail ||
        error.message ||
        "Automatic image search failed. Check the backend and internet connection."
      );
    } finally {
      setFetchingAutoImages(false);
    }
  };

  // =========================

  // DOWNLOAD CSV TEMPLATE

  // =========================

  const handleDownloadTemplate = () => {

    const csvContent = [

      "name,price,quantity,categoryId,supplierId,imageUrl",

      'USB Keyboard,850,20,,,',

      'Laptop Stand,1200,15,,,',

      'Wireless Speaker,2500,8,,,',

    ].join("\r\n");



    const blob = new Blob(

      ["\uFEFF", csvContent],

      { type: "text/csv;charset=utf-8;" }

    );



    const downloadUrl = URL.createObjectURL(blob);

    const link = document.createElement("a");



    link.href = downloadUrl;

    link.download = "products-template.csv";



    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);



    URL.revokeObjectURL(downloadUrl);

  };



  // =========================

  // SEARCH PRODUCTS

  // =========================

  const filteredProducts = products.filter((product) => {

    const searchText = search.toLowerCase().trim();



    if (!searchText) return true;



    return (

      product.name?.toLowerCase().includes(searchText) ||

      product.categoryName?.toLowerCase().includes(searchText) ||

      product.supplierName?.toLowerCase().includes(searchText) ||

      String(product.id).includes(searchText)

    );

  });



  // =========================

  // FORMAT IMPORT ERRORS

  // =========================

  const getImportErrorText = (item) => {

    if (typeof item === "string") return item;



    if (item && typeof item === "object") {

      const row = item.row ? `Row ${item.row}: ` : "";

      const detail =

        item.message ||

        item.error ||

        item.detail ||

        JSON.stringify(item);



      return `${row}${detail}`;

    }



    return String(item);

  };



  // =========================

  // RENDER

  // =========================

  return (

    <div className="products-page">



      {/* HEADER */}

      <div className="products-header">

        <div>

          <h1>Products</h1>

          <p>Manage your inventory products</p>

        </div>



        <div className="products-header-actions">

          <button

            type="button"

            className="add-product-button"

            onClick={handleDownloadTemplate}

          >

            Download CSV Template

          </button>



          <label

            htmlFor="products-csv-file"

            className="add-product-button csv-select-button"

          >

            {csvFile ? "Change CSV File" : "Choose CSV File"}

          </label>



          <input

            ref={csvInputRef}

            id="products-csv-file"

            type="file"

            accept=".csv,text/csv"

            onChange={handleCsvFileChange}

            style={{ display: "none" }}

          />



          <button

            type="button"

            className="add-product-button"

            onClick={handleCsvImport}

            disabled={!csvFile || importingCsv}

          >

            {importingCsv ? "Importing..." : "Bulk Import CSV"}

          </button>



          <button

            type="button"

            className="add-product-button"

            onClick={handleAddProduct}

          >

            + Add Product

          </button>

        </div>

      </div>



      {/* SELECTED CSV FILE */}

      {csvFile && (

        <div className="alert alert-info">

          Selected file: <strong>{csvFile.name}</strong>

          {" "}({(csvFile.size / 1024).toFixed(1)} KB)

        </div>

      )}



      {/* SUCCESS MESSAGE */}

      {message && (

        <div className="alert alert-success" role="status">

          {message}

        </div>

      )}



      {/* ERROR MESSAGE */}

      {errorMessage && (

        <div className="alert alert-danger" role="alert">

          {errorMessage}

        </div>

      )}



      {/* CSV ROW ERRORS */}

      {importErrors.length > 0 && (

        <div className="alert alert-warning">

          <strong>Some CSV rows could not be imported:</strong>



          <ul>

            {importErrors.map((item, index) => (

              <li key={`${item?.row ?? "row"}-${index}`}>

                {getImportErrorText(item)}

              </li>

            ))}

          </ul>

        </div>

      )}



      {/* CSV FORMAT HELP */}

      <div className="products-card csv-import-help">

        <h4>Bulk Import Instructions</h4>



        <p>

          Use a CSV file to import many products at once.

          The first row must contain the column names.

        </p>



        <p>

          <strong>Required columns:</strong>{" "}

          <code>name, price, quantity</code>

        </p>



        <p>

          <strong>Optional columns:</strong>{" "}

          <code>categoryId, supplierId, imageUrl</code>

        </p>



        <p>

          Category and supplier IDs must already exist in your database.

          Leave optional values blank if they are not needed.

          The maximum CSV file size is 5 MB.

        </p>

      </div>



            {/* IMPORT AND IMAGE TOOLS */}
        <section className="product-tools-grid">
          <div className="product-tool-card">
            <div className="product-tool-heading">
              <span className="product-tool-icon">⇧</span>
              <div>
                <h3>Bulk product import</h3>
                <p>Add many products from one CSV file.</p>
              </div>
            </div>
            <div className="product-tool-actions">
              <button type="button" className="product-tool-button product-tool-button-secondary" onClick={handleDownloadTemplate}>
                Download template
              </button>
              <label htmlFor="products-csv-file" className="product-tool-button product-tool-button-secondary">
                {csvFile ? "Change CSV file" : "Choose CSV file"}
              </label>
              <input ref={csvInputRef} id="products-csv-file" type="file" accept=".csv,text/csv" onChange={handleCsvFileChange} hidden />
              <button type="button" className="product-tool-button product-tool-button-primary" onClick={handleCsvImport} disabled={!csvFile || importingCsv}>
                {importingCsv ? "Importing..." : "Import products"}
              </button>
            </div>
            {csvFile && <p className="product-tool-file">Selected: <strong>{csvFile.name}</strong> · {(csvFile.size / 1024).toFixed(1)} KB</p>}
            <details className="product-tool-details">
              <summary>CSV format and requirements</summary>
              <p>Required columns: <code>name, price, quantity</code></p>
              <p>Optional columns: <code>categoryId, supplierId, imageUrl</code></p>
              <p>Maximum file size: 5 MB. Category and supplier IDs must already exist.</p>
            </details>
          </div>

          <div className="product-tool-card product-tool-card-image">
            <div className="product-tool-heading">
              <span className="product-tool-icon product-tool-icon-image">✦</span>
              <div>
                <h3>Automatic product images</h3>
                <p>Find images online using product names. No manual downloads or renaming.</p>
              </div>
            </div>
            <div className="product-image-summary">
              <div><strong>{products.length}</strong><span>Total products</span></div>
              <div><strong>{products.filter((product) => product.imageName).length}</strong><span>With images</span></div>
              <div><strong>{products.filter((product) => !product.imageName).length}</strong><span>Missing images</span></div>
            </div>
            <button type="button" className="product-tool-button product-tool-button-primary product-auto-image-button"
              onClick={handleAutoFetchImages} disabled={fetchingAutoImages || loading || products.length === 0}>
              {fetchingAutoImages ? "Searching and saving images..." : "Find images automatically"}
            </button>
            <p className="product-tool-note">
              Searches openly licensed image sources. Existing product images are preserved.
              Some products may not have a suitable result.
            </p>
          </div>
        </section>

        {autoImageResult?.results?.length > 0 && (
          <div className="product-tool-card product-auto-results">
            <h3>Automatic image search results</h3>
            <div className="product-auto-result-stats">
              <span>Saved: <strong>{autoImageResult.successCount ?? 0}</strong></span>
              <span>Failed: <strong>{autoImageResult.failureCount ?? 0}</strong></span>
              <span>Skipped: <strong>{autoImageResult.skippedCount ?? 0}</strong></span>
            </div>
            <div className="product-auto-result-list">
              {autoImageResult.results.map((item, index) => (
                <div className="product-auto-result-row" key={`${item.productId}-${index}`}>
                  <span>{item.productName} (#{item.productId})</span>
                  <span className={item.status === "SUCCESS" ? "product-result-success" : "product-result-failure"}>{item.status}</span>
                  {item.license && <small>{item.license}</small>}
                  {item.sourcePage && <a href={item.sourcePage} target="_blank" rel="noreferrer">Source</a>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ADD / EDIT FORM */}

      {showForm && (

        <div className="products-card add-form-card">



          <div className="form-header">

            <div>

              <h4>

                {editingId !== null

                  ? "Edit Product"

                  : "Add New Product"}

              </h4>



              <p>

                {editingId !== null

                  ? "Update the product details below."

                  : "Enter the product details below."}

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



              {/* IMAGE URL */}

              <div className="col-md-12">

                <label className="form-label">

                  Product Image URL (optional)

                </label>



                <input

                  type="url"

                  name="imageUrl"

                  className="form-control"

                  placeholder="https\://example.com/product.png"

                  value={form.imageUrl}

                  onChange={handleChange}

                />

              </div>



              {/* PRODUCT NAME */}

              <div className="col-md-6">

                <label className="form-label">

                  Product Name

                </label>



                <input

                  type="text"

                  name="name"

                  className="form-control"

                  placeholder="Enter product name"

                  value={form.name}

                  onChange={handleChange}

                  required

                />

              </div>



              {/* PRICE */}

              <div className="col-md-3">

                <label className="form-label">

                  Price

                </label>



                <input

                  type="number"

                  name="price"

                  className="form-control"

                  placeholder="0"

                  min="0"

                  step="0.01"

                  value={form.price}

                  onChange={handleChange}

                  required

                />

              </div>



              {/* QUANTITY */}

              <div className="col-md-3">

                <label className="form-label">

                  Quantity

                </label>



                <input

                  type="number"

                  name="quantity"

                  className="form-control"

                  placeholder="0"

                  min="0"

                  step="1"

                  value={form.quantity}

                  onChange={handleChange}

                  required

                />

              </div>



              {/* CATEGORY */}

              <div className="col-md-6">

                <label className="form-label">

                  Category

                </label>



                <select

                  name="categoryId"

                  className="form-select"

                  value={form.categoryId}

                  onChange={handleChange}

                >

                  <option value="">Select category</option>



                  {categories.map((category) => (

                    <option

                      key={category.id}

                      value={category.id}

                    >

                      {category.name}

                    </option>

                  ))}

                </select>

              </div>



              {/* SUPPLIER */}

              <div className="col-md-6">

                <label className="form-label">

                  Supplier

                </label>



                <select

                  name="supplierId"

                  className="form-select"

                  value={form.supplierId}

                  onChange={handleChange}

                >

                  <option value="">Select supplier</option>



                  {suppliers.map((supplier) => (

                    <option

                      key={supplier.id}

                      value={supplier.id}

                    >

                      {supplier.name}

                    </option>

                  ))}

                </select>

              </div>

            </div>



            {/* FORM BUTTONS */}

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

                className="save-product-button"

                disabled={saving}

              >

                {saving

                  ? "Saving..."

                  : editingId !== null

                    ? "Update Product"

                    : "Save Product"}

              </button>

            </div>

          </form>

        </div>

      )}



      {/* PRODUCTS TABLE CARD */}

      <div className="products-card">



        <div className="products-card-header">

          <div>

            <h4>All Products</h4>



            <span>

              {filteredProducts.length} products

            </span>

          </div>



          {/* SEARCH */}

          <input

            type="text"

            className="product-search"

            placeholder="Search products..."

            value={search}

            onChange={(e) => setSearch(e.target.value)}

          />

        </div>



        {/* PRODUCTS TABLE */}

        <div className="table-responsive">

          <table className="table products-table">

            <thead>

              <tr>

                <th>Product</th>

                <th>Price</th>

                <th>Quantity</th>

                <th>Category</th>

                <th>Supplier</th>

                <th>Status</th>

                <th>Actions</th>

              </tr>

            </thead>



            <tbody>

              {loading ? (

                <tr>

                  <td colSpan="7" className="text-center py-5">

                    Loading products...

                  </td>

                </tr>

              ) : filteredProducts.length === 0 ? (

                <tr>

                  <td colSpan="7" className="text-center py-5">

                    {search

                      ? "No products match your search"

                      : "No products found"}

                  </td>

                </tr>

              ) : (

                filteredProducts.map((product) => (

                  <tr key={product.id}>



                    {/* PRODUCT */}

                    <td>

                      <div className="product-cell">

                        {product.imageName ? (

                          <img

                            src={`http://localhost:8080/product-images/${encodeURIComponent(product.imageName)}`}

                            alt={product.name}

                            className="product-placeholder"

                            style={{ objectFit: "cover" }}

                            onError={(e) => {

                              e.currentTarget.style.display = "none";

                            }}

                          />

                        ) : (

                          <div className="product-placeholder">

                            📦

                          </div>

                        )}



                        <div>

                          <strong>{product.name}</strong>

                          <small>ID: #{product.id}</small>

                        </div>

                      </div>

                    </td>



                    {/* PRICE */}

                    <td>

                      <strong>

                        ₹

                        {Number(product.price).toLocaleString("en-IN")}

                      </strong>

                    </td>



                    {/* QUANTITY */}

                    <td>{product.quantity}</td>



                    {/* CATEGORY */}

                    <td>

                      {product.categoryName || "No category"}

                    </td>



                    {/* SUPPLIER */}

                    <td>

                      {product.supplierName || "No supplier"}

                    </td>



                    {/* STOCK STATUS */}

                    <td>

                      {Number(product.quantity) === 0 ? (

                        <span className="status-badge out">

                          Out of Stock

                        </span>

                      ) : Number(product.quantity) <= 10 ? (

                        <span className="status-badge low">

                          Low Stock

                        </span>

                      ) : (

                        <span className="status-badge available">

                          In Stock

                        </span>

                      )}

                    </td>



                    {/* ACTIONS */}

                    <td>

                      <div className="action-buttons">



                        <button

                          type="button"

                          className="view-button"

                          title="View Product"

                          onClick={() => handleView(product)}

                        >

                          👁️

                        </button>



                        <button

                          type="button"

                          className="edit-button"

                          title="Edit Product"

                          onClick={() => handleEdit(product)}

                        >

                          ✏️

                        </button>



                        <button

                          type="button"

                          className="delete-button"

                          title="Delete Product"

                          onClick={() => handleDelete(product.id)}

                        >

                          🗑️

                        </button>



                      </div>

                    </td>

                  </tr>

                ))

              )}

            </tbody>

          </table>

        </div>

      </div>



      {/* VIEW PRODUCT MODAL */}

      {showDetails && selectedProduct && (

        <div

          className="product-modal-overlay"

          onClick={closeDetails}

        >

          <div

            className="product-modal"

            onClick={(e) => e.stopPropagation()}

          >



            {/* MODAL HEADER */}

            <div className="product-modal-header">

              <div>

                <h3>Product Details</h3>

                <p>Product ID: #{selectedProduct.id}</p>

              </div>



              <button

                type="button"

                className="close-button"

                onClick={closeDetails}

              >

                ✕

              </button>

            </div>



            {/* PRODUCT IMAGE */}

            {selectedProduct.imageName && (

              <div className="product-details-image-container">

                <img

                  src={`http://localhost:8080/product-images/${encodeURIComponent(selectedProduct.imageName)}`}

                  alt={selectedProduct.name}

                  className="product-details-image"

                  onError={(e) => {

                    e.currentTarget.style.display = "none";

                  }}

                />

              </div>

            )}



            {/* PRODUCT DETAILS */}

            <div className="product-details">

              <div className="detail-item">

                <span>Product Name</span>

                <strong>{selectedProduct.name}</strong>

              </div>



              <div className="detail-item">

                <span>Price</span>

                <strong>

                  ₹

                  {Number(selectedProduct.price).toLocaleString("en-IN")}

                </strong>

              </div>



              <div className="detail-item">

                <span>Quantity</span>

                <strong>{selectedProduct.quantity}</strong>

              </div>



              <div className="detail-item">

                <span>Category</span>

                <strong>

                  {selectedProduct.categoryName || "No category"}

                </strong>

              </div>



              <div className="detail-item">

                <span>Supplier</span>

                <strong>

                  {selectedProduct.supplierName || "No supplier"}

                </strong>

              </div>



              <div className="detail-item">

                <span>Stock Status</span>

                <strong>

                  {Number(selectedProduct.quantity) === 0

                    ? "Out of Stock"

                    : Number(selectedProduct.quantity) <= 10

                      ? "Low Stock"

                      : "In Stock"}

                </strong>

              </div>

            </div>



            {/* MODAL FOOTER */}

            <div className="product-modal-footer">

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



export default Products;
