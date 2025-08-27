# E-Commerce Backend System - README

## 📖 Overview

This project is a comprehensive e-commerce management system built with **Node.js** and **Express.js**, featuring advanced authentication and role-based authorization. The system supports multiple user roles (admin, user) and provides a robust API for managing products, orders, and users.

## ✨ Key Features

- **Secure Authentication System** using JWT and encrypted passwords
- **Advanced Role Management** (admin, regular user)
- **Complete Product Management** (create, update, delete, filter)
- **Integrated Order System** with inventory tracking
- **Password Recovery** via email
- **User Accounts** with soft/hard delete capabilities

## 🛠 Technology Stack

- **Node.js** - JavaScript runtime environment
- **Express.js** - Web application framework
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB object modeling
- **JWT** - Token-based authentication
- **bcryptjs** - Password encryption
- **Nodemailer** - Email delivery

## 📁 Project Structure

```
├── controllers/
│   ├── authController.js    # Authentication and user management
│   ├── orderController.js   # Order management
│   ├── productController.js # Product management
│   └── userController.js    # User management
├── models/
│   ├── userModel.js         # User schema
│   ├── productModel.js      # Product schema
│   └── orderModel.js        # Order schema
├── utils/
│   ├── appError.js          # Error handling
│   ├── catchAsync.js        # Async error handling
│   └── email.js             # Email functionality
└── routes/                  # Route definitions
```

## 🔐 Authentication & Authorization System

### Available Roles:
- **Admin**: Full system privileges
- **User**: Limited privileges (personal orders, profile management)

### Protection Middleware:
- `protect`: Secures routes and verifies logged-in users
- `restrictTo`: Limits access based on user roles
- `isAdmin`: Verifies admin privileges

# 📋 API Usage Guide - E-Commerce System

## 🔐 Authentication Endpoints

### 1. User Registration
**Endpoint:** `POST /api/v1/auth/signup`
```json
// Request Body
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "passwordConfirm": "password123",
  "role": "user" // Optional - defaults to 'user'
}

// Response
{
  "status": "success",
  "token": "eyJhbGciOiJIUzI1NiIsInR5...",
  "data": {
    "user": {
      "id": "5f8d0d55b...",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "user"
    }
  }
}
```

### 2. User Login
**Endpoint:** `POST /api/v1/auth/login`
```json
// Request Body
{
  "email": "john@example.com",
  "password": "password123"
}

// Response
{
  "status": "success",
  "token": "eyJhbGciOiJIUzI1NiIsInR5...",
  "data": {
    "user": {
      "id": "5f8d0d55b...",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "user"
    }
  }
}
```

### 3. Password Reset Request
**Endpoint:** `POST /api/v1/auth/forgot-password`
```json
// Request Body
{
  "email": "john@example.com"
}

// Response
{
  "status": "success",
  "message": "Token sent to email!"
}
```

### 4. Password Reset
**Endpoint:** `PATCH /api/v1/auth/reset-password/:token`
```json
// Request Body
{
  "password": "newpassword123",
  "passwordConfirm": "newpassword123"
}

// Response
{
  "status": "success",
  "token": "eyJhbGciOiJIUzI1NiIsInR5..." // New JWT token
}
```

## 🛍️ Product Endpoints

### 1. Get All Products
**Endpoint:** `GET /api/v1/products`
```json
// Headers
Authorization: Bearer <jwt_token>

// Response
{
  "status": "success",
  "results": 15,
  "data": {
    "products": [
      {
        "_id": "5f8d0d55b...",
        "name": "iPhone 12",
        "price": 999,
        "category": "electronics",
        "countInStock": 10,
        "description": "Latest iPhone model"
      }
    ]
  }
}
```

### 2. Get Single Product
**Endpoint:** `GET /api/v1/products/:id`
```json
// Response
{
  "status": "success",
  "data": {
    "product": {
      "_id": "5f8d0d55b...",
      "name": "iPhone 12",
      "price": 999,
      "category": "electronics",
      "countInStock": 10
    }
  }
}
```

### 3. Create Product (Admin Only)
**Endpoint:** `POST /api/v1/products`
```json
// Request Body
{
  "name": "MacBook Pro",
  "price": 1999,
  "category": "electronics",
  "countInStock": 15,
  "description": "Apple MacBook Pro 16-inch"
}

// Response
{
  "status": "success",
  "data": {
    "product": {
      "_id": "5f8d0d55b...",
      "name": "MacBook Pro",
      "price": 1999,
      "category": "electronics",
      "countInStock": 15
    }
  }
}
```

### 4. Update Product (Admin Only)
**Endpoint:** `PATCH /api/v1/products/:id`
```json
// Request Body
{
  "price": 1899,
  "countInStock": 20
}

// Response
{
  "status": "success",
  "data": {
    "product": {
      "_id": "5f8d0d55b...",
      "name": "MacBook Pro",
      "price": 1899,
      "category": "electronics",
      "countInStock": 20
    }
  }
}
```

### 5. Filter Products by Price Range
**Endpoint:** `GET /api/v1/products/price-range?minPrice=100&maxPrice=500`
```json
// Response
[
  {
    "_id": "5f8d0d55b...",
    "name": "Wireless Headphones",
    "price": 199,
    "category": "electronics"
  }
]
```

### 6. Filter Products by Category
**Endpoint:** `GET /api/v1/products/category/electronics`
```json
// Response
[
  {
    "_id": "5f8d0d55b...",
    "name": "iPhone 12",
    "price": 999,
    "category": "electronics"
  }
]
```

## 👥 User Endpoints

### 1. Get Current User Profile
**Endpoint:** `GET /api/v1/users/me`
```json
// Response
{
  "status": "success",
  "data": {
    "user": {
      "_id": "5f8d0d55b...",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "user"
    }
  }
}
```

### 2. Update User Profile
**Endpoint:** `PATCH /api/v1/users/update-me`
```json
// Request Body
{
  "name": "John Smith",
  "email": "john.smith@example.com"
}

// Response
{
  "status": "success",
  "data": {
    "user": {
      "_id": "5f8d0d55b...",
      "name": "John Smith",
      "email": "john.smith@example.com",
      "role": "user"
    }
  }
}
```

### 3. Get All Users (Admin Only)
**Endpoint:** `GET /api/v1/users`
```json
// Response
{
  "status": "success",
  "results": 5,
  "data": {
    "users": [
      {
        "_id": "5f8d0d55b...",
        "name": "John Doe",
        "email": "john@example.com",
        "role": "user",
        "active": true
      }
    ]
  }
}
```

## 📦 Order Endpoints

### 1. Create New Order
**Endpoint:** `POST /api/v1/orders`
```json
// Request Body
{
  "items": [
    {
      "product": "5f8d0d55b...", // Product ID
      "quantity": 2
    }
  ],
  "shippingAddress": {
    "address": "123 Main St",
    "city": "New York",
    "postalCode": "10001",
    "country": "USA"
  },
  "paymentMethod": "credit_card"
}

// Response
{
  "status": "success",
  "data": {
    "order": {
      "_id": "5f8d0d55b...",
      "user": "5f8d0d55b...",
      "items": [
        {
          "product": "5f8d0d55b...",
          "quantity": 2,
          "price": 1999
        }
      ],
      "totalAmount": 3998,
      "status": "pending"
    }
  }
}
```

### 2. Get User Orders
**Endpoint:** `GET /api/v1/orders/my-orders`
```json
// Response
{
  "status": "success",
  "results": 3,
  "data": {
    "orders": [
      {
        "_id": "5f8d0d55b...",
        "user": "5f8d0d55b...",
        "items": [
          {
            "product": {
              "name": "iPhone 12",
              "price": 999
            },
            "quantity": 1,
            "price": 999
          }
        ],
        "totalAmount": 999,
        "status": "delivered"
      }
    ]
  }
}
```

### 3. Update Order Status (Admin Only)
**Endpoint:** `PATCH /api/v1/orders/:id`
```json
// Request Body
{
  "status": "shipped"
}

// Response
{
  "status": "success",
  "data": {
    "order": {
      "_id": "5f8d0d55b...",
      "status": "shipped",
      "items": [...]
    }
  }
}
```

## 🔒 Authorization Headers

All protected endpoints require a JWT token in the Authorization header:

```http
GET /api/v1/users/me
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5...
```

## 🚨 Error Responses

### Authentication Error (401)
```json
{
  "status": "error",
  "message": "You are not logged in!"
}
```

### Authorization Error (403)
```json
{
  "status": "error",
  "message": "You do not have permission for this action"
}
```

### Not Found Error (404)
```json
{
  "status": "error",
  "message": "No product found with that ID"
}
```

### Validation Error (400)
```json
{
  "status": "error",
  "message": "Price must be greater than 0"
}
```

## 📋 Example API Workflow

### 1. User Registration & Login
```javascript
// Register
const register = await fetch('/api/v1/auth/signup', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(userData)
});

// Login
const login = await fetch('/api/v1/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password })
});

const { token } = await login.json();
```

### 2. Browse Products
```javascript
// Get all products
const products = await fetch('/api/v1/products', {
  headers: { 'Authorization': `Bearer ${token}` }
});

// Filter by category
const electronics = await fetch('/api/v1/products/category/electronics', {
  headers: { 'Authorization': `Bearer ${token}` }
});
```

### 3. Create Order
```javascript
const order = await fetch('/api/v1/orders', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify(orderData)
});
```

## 🚀 Installation & Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure environment variables**:
   Create a `.env` file with the following variables:
   ```
   NODE_ENV=development
   PORT=3000
   DATABASE=mongodb://localhost:27017/your-database-name
   JWT_SECRET=your-super-secret-jwt-key
   JWT_EXPIRES_IN=90d
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USERNAME=your-email@gmail.com
   EMAIL_PASSWORD=your-email-password
   ```

3. **Start the server**:
   ```bash
   npm start
   ```

## 📊 System Benefits

1. **Security**: Robust authentication with password encryption and route protection
2. **Flexibility**: Support for multiple roles and permissions
3. **Efficiency**: Effective inventory and order management
4. **Scalability**: Modular design for easy feature expansion
5. **User Experience**: Clear and easy-to-use API interface

