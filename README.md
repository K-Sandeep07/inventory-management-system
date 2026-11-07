# Inventory Management System

A full-stack inventory management application built with **Spring Boot, React, and MySQL**. It helps manage products, categories, suppliers, stock movements, and inventory records through a web-based dashboard.

<p align="center">
  <strong>Spring Boot · React · MySQL · JWT Authentication</strong>
</p>

---

## Overview

The Inventory Management System provides a centralized place to manage inventory operations. It combines a RESTful Spring Boot backend with a React frontend and a MySQL database.

The project focuses on practical full-stack development concepts, including REST API design, authentication and authorization, database relationships, file uploads, bulk data import, and frontend-backend integration.

## Features

- **Authentication and authorization** — user login and JWT-based protection for secured APIs.
- **Product management** — create, view, update, and delete product records.
- **Product images** — upload and display product images.
- **Bulk product import** — import multiple products from a CSV file instead of entering them individually.
- **Categories** — organize products by category.
- **Suppliers** — maintain supplier records and associate suppliers with products.
- **Stock management** — record stock-in and stock-out operations.
- **Stock transaction history** — review recorded inventory movements.
- **Dashboard and reports** — view inventory information through the application interface.
- **Pagination** — retrieve product records in manageable pages.
- **Password recovery** — email-based OTP verification flow for password reset.

## Tech Stack

| Layer | Technologies |
|---|---|
| Frontend | React, JavaScript, HTML, CSS |
| Backend | Java 21, Spring Boot |
| API | Spring REST APIs |
| Security | Spring Security, JWT |
| Database | MySQL |
| ORM | Spring Data JPA, Hibernate |
| Build tool | Maven |
| Frontend tooling | Vite |

## Project Structure

```text
inventory-management-system/
├── frontend/                  # React application
│   ├── public/
│   └── src/
│       ├── components/
│       ├── pages/
│       └── ...
├── src/
│   ├── main/
│   │   ├── java/com/satee/inventory_management/
│   │   │   ├── config/
│   │   │   ├── controller/
│   │   │   ├── dto/
│   │   │   ├── entity/
│   │   │   ├── exception/
│   │   │   ├── repository/
│   │   │   ├── security/
│   │   │   └── service/
│   │   └── resources/
│   │       └── application-example.properties
│   └── test/
├── .gitignore
├── pom.xml
├── mvnw
└── mvnw.cmd
```

## Getting Started

### Prerequisites

Install the following before running the project:

- Java 21
- MySQL 8 or a compatible MySQL release
- Node.js and npm
- Git

### 1. Clone the repository

```bash
git clone https://github.com/K-Sandeep07/inventory-management-system.git
cd inventory-management-system
```

### 2. Create the MySQL database

Open MySQL and run:

```sql
CREATE DATABASE inventory_db;
```

### 3. Configure the backend

Create a local file named `application.properties` inside:

```text
src/main/resources/
```

Use `src/main/resources/application-example.properties` as the template. Set your own database credentials, mail settings (if using email-based password recovery), and a strong JWT secret.

Example configuration:

```properties
spring.application.name=inventory-management

spring.datasource.url=jdbc:mysql://localhost:3306/inventory_db
spring.datasource.username=YOUR_MYSQL_USERNAME
spring.datasource.password=YOUR_MYSQL_PASSWORD

spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=false
spring.jpa.properties.hibernate.format_sql=true

spring.mail.host=smtp.gmail.com
spring.mail.port=587
spring.mail.username=YOUR_EMAIL
spring.mail.password=YOUR_EMAIL_APP_PASSWORD
spring.mail.properties.mail.smtp.auth=true
spring.mail.properties.mail.smtp.starttls.enable=true

server.port=8080
app.upload.dir=uploads/product-images

jwt.secret=YOUR_STRONG_SECRET_OF_AT_LEAST_32_CHARACTERS
```

Use an email provider's app password where required. Never commit your real `application.properties`, database password, email credentials, or JWT secret. The local configuration file is excluded through `.gitignore`.

### 4. Run the backend

From the project root:

**Windows PowerShell:**

```powershell
.\mvnw.cmd spring-boot:run
```

**macOS / Linux:**

```bash
./mvnw spring-boot:run
```

The backend runs at:

```text
http://localhost:8080
```

### 5. Run the frontend

Open a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Open the local URL printed by Vite in your terminal (commonly `http://localhost:5173`).

## Bulk Product Import

The application supports importing multiple product records through CSV.

The CSV import endpoint is:

```http
POST /api/products/import-csv
```

The import file should include the required columns:

```csv
name,price,quantity
Laptop,60000,25
Wireless Mouse,750,100
Monitor,12000,15
```

Optional columns supported by the import service:

```csv
name,price,quantity,categoryId,supplierId
Laptop,60000,25,1,1
```

Use valid category and supplier IDs when supplying those optional columns. The endpoint is protected by the application's authentication rules, so include a valid JWT when calling it.

## Product Image Uploads

Product images are uploaded through the backend:

```http
POST /api/products/{id}/image
```

Send the image as multipart form data using the field name expected by the API. Uploaded files are stored in the configured `app.upload.dir` directory. The default directory is:

```text
uploads/product-images
```

The `uploads/` directory is excluded from Git. Back up this directory separately if you need to preserve locally uploaded images.

## API Base URL

```text
http://localhost:8080
```

The backend exposes REST endpoints for authentication, products, categories, suppliers, and stock operations. Refer to the controller classes under `src/main/java/com/satee/inventory_management/controller/` for the implemented routes and request formats.

## Security Notes

- JWT is used to authenticate protected API requests.
- Keep credentials and secrets in local configuration or environment variables.
- Do not commit `application.properties`, uploaded files, build output, or `node_modules`.
- Use a unique, strong JWT secret outside development environments.
- Configure production database and email credentials securely before deployment.

## Future Improvements

- Cloud-based product image storage
- Production deployment
- Automated tests for key API workflows
- Enhanced analytics and reporting

## Author

**K. Sandeep**

GitHub: [@K-Sandeep07](https://github.com/K-Sandeep07)

Project repository: [inventory-management-system](https://github.com/K-Sandeep07/inventory-management-system)

---

*Built as a full-stack project to demonstrate practical Java backend and React frontend development.*
