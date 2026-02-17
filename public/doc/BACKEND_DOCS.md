# Pharmetix Backend Documentation

**"Your Trusted Online Medicine Shop"**

---

## 1️⃣ PROJECT OVERVIEW

**Pharmetix** is a multi-vendor e-commerce platform dedicated to Over-The-Counter (OTC) medicines. It connects customers with verified sellers (pharmacies) and provides a seamless purchasing experience with Cash on Delivery (COD) support.

### System Goals

- **Accessibility:** Make OTC medicines easily accessible to customers.
- **Management:** Empower sellers to manage inventory and orders efficiently.
- **Trust:** Ensure a secure and reliable platform through admin moderation.

### Target Users

- **Customers:** Individuals buying medicines.
- **Sellers:** Pharmacies or vendors selling medicines.
- **Admins:** Platform owners managing the ecosystem.

### High-Level Architecture

- **Client:** React / Next.js (Frontend)
- **API Gateway/Server:** Node.js + Express
- **Database:** PostgreSQL (Relational Data)
- **ORM:** Prisma
- **Auth:** Better-Auth (Session/JWT)

---

## 2️⃣ BACKEND ARCHITECTURE

### Folder Structure Overview

The backend is structured modularly to ensure scalability and maintainability.

- `prisma/` - Database schema and migrations.
- `src/app.ts` - Express app setup, middleware registration.
- `src/server.ts` - Server entry point.
- `src/config/` - Environment variables and configuration.
- `src/modules/` - Feature-based modules (Controller, Service, Routes).
  - `user/`, `medicine/`, `order/`, etc.
- `src/middlewares/` - Global and route-specific middlewares (Auth, Validation, Error).
- `src/lib/` - Third-party library configurations (e.g., Prisma Client).
- `src/utils/` - Helper functions.

### Request Lifecycle

1.  **Client Request:** Frontend sends HTTP request.
2.  **Global Middleware:** CORS, Body Parser, Logger.
3.  **Router:** Routes request to specific module based on path (`/api/v1/...`).
4.  **Auth Middleware:** `authorize` checks JWT/Session and user role.
5.  **Controller:** Handles HTTP request/response logic, validates input.
6.  **Service:** Contains business logic and interacts with Database.
7.  **Database:** Prisma executes query on PostgreSQL.
8.  **Response:** JSON response sent back to client.

### Error Handling Strategy

- All errors are intercepted by a global error handling middleware.
- APIs return standard HTTP status codes (2xx, 4xx, 5xx).
- JSON error response format is consistent (see Section 12).

### Authentication Flow

- **Better-Auth** is used for secure authentication.
- **Sessions/JWT:** HTTP-only cookies or Bearer tokens (depending on better-auth config) are used to maintain state.
- **Role-Based:** Middleware guards routes based on `UserRole` (CUSTOMER, SELLER, ADMIN).

---

## 3️⃣ AUTHENTICATION & AUTHORIZATION

### Registration Flow

1.  User submits Registration Form.
2.  **Input:** Name, Email, Password, **Role** (Customer/Seller).
    - _Note:_ Admin accounts are seeded and cannot be registered publicly.
3.  Backend creates `User` and `Account`.
4.  **Response:** User created successfully.

### Login Flow

1.  User submits Login Form (Email, Password).
2.  Backend verifies credentials.
3.  On success, backend sets a **Session Cookie** or returns an **Access Token**.
4.  **Response:** User info + Token (if applicable).

### Protected Routes

- Include `Authorization: Bearer <token>` header or ensure Cookie is sent with credentials (`credentials: 'include'`).
- Middleware checks if user is logged in.
- Role guard checks if user has permission.

### `/api/auth/me` Behavior

- **Purpose:** Frontend should call this on app load (layout mount) to check if user is logged in.
- **Returns:** Current user profile and role if authenticated.
- **Error:** 401 Unauthorized if not logged in.

---

## 4️⃣ USER ROLES & PERMISSIONS

| Feature                 |  Customer 👤   |   Seller 🏪   |    Admin 🛡️    |
| :---------------------- | :------------: | :-----------: | :------------: |
| **Browse Medicines**    |       ✅       |      ✅       |       ✅       |
| **Search/Filter**       |       ✅       |      ✅       |       ✅       |
| **Add to Cart**         |       ✅       |      ❌       |       ❌       |
| **Place Order**         |       ✅       |      ❌       |       ❌       |
| **View Own Orders**     |       ✅       | ✅ (Incoming) |    ✅ (All)    |
| **Update Order Status** |       ❌       |   ✅ (Own)    |    ✅ (All)    |
| **Add/Edit Medicine**   |       ❌       |      ✅       |       ✅       |
| **Manage Categories**   |       ❌       |      ❌       |       ✅       |
| **Manage Users**        |       ❌       |      ❌       | ✅ (Ban/Unban) |
| **Write Reviews**       | ✅ (Purchased) |      ❌       |       ❌       |

**UI Implications:**

- Hide "Add to Cart" for Sellers/Admins.
- Show "Seller Dashboard" link only for Sellers.
- Show "Admin Panel" link only for Admins.

---

## 5️⃣ DATABASE MODELS

### 1. User

Represents all system users.

- `id` (PK): UUID
- `name`: String
- `email`: String (Unique)
- `role`: Enum (`CUSTOMER`, `SELLER`, `ADMIN`) - Default `CUSTOMER`
- `status`: Enum (`ACTIVE`, `INACTIVE`, `BANNED`) - Default `ACTIVE`
- `createdAt`, `updatedAt`

### 2. Category

Medicine categories (e.g., "Pain Relief", "Antibiotics").

- `id` (PK): UUID
- `name`: String (Unique)
- `slug`: String (Unique) - for URLs
- `image`: String (URL)
- `isActive`: Boolean

### 3. Medicine

The product listed by a seller.

- `id` (PK): UUID
- `slug`: String
- `brandName`: String (e.g., "Napa")
- `genericName`: String (e.g., "Paracetamol")
- `strength`: String (e.g., "500mg")
- `dosageForm`: Enum (`TABLET`, `SYRUP`, etc.)
- `price`: Float (Price per unit/pack)
- `stockQuantity`: Int (Current inventory)
- `sellerId`: FK to User
- `categoryId`: FK to Category
- `image`: String (URL)
- `description`: String

### 4. Order

A purchase made by a customer.

- `id` (PK): UUID
- `orderNumber`: String (Unique, user-facing ID)
- `customerId`: FK to User
- `totalAmount`: Float
- `status`: Enum (`PLACED`, `PROCESSING`, `SHIPPED`, `DELIVERED`, `CANCELLED`)
- `paymentMethod`: String (Default "COD")
- `shippingAddress`: String (JSON or separate fields)

### 5. OrderItem

Individual items within an order.

- `id` (PK): UUID
- `orderId`: FK to Order
- `medicineId`: FK to Medicine
- `quantity`: Int
- `unitPrice`: Float (Snapped at time of order)
- `subTotal`: Float (`quantity * unitPrice`)
- `sellerId`: FK to User (To group orders for sellers)

### 6. Review

Customer feedback.

- `id` (PK): UUID
- `rating`: Float (1-5)
- `comment`: String
- `customerId`: FK
- `medicineId`: FK
- `orderId`: FK (Ensures verified purchase)

---

## 6️⃣ API DESIGN

**Base URL:** `http://localhost:5000/api/v1`

### 🔐 Authentication: APIs from better-auth

### 💊 Medicines (Public)

#### 1. Get All Medicines

- **Endpoint:** `/medicines`
- **Method:** `GET`
- **Query Params:**
  - `page` (int, default 1)
  - `limit` (int, default 10)
  - `search` (string, optional): Matches brand or generic name
  - `category` (string, optional): Filter by category slug
  - `minPrice` (number, optional)
  - `maxPrice` (number, optional)
  - `sort` (string, optional): `price-asc`, `price-desc`, `newest`
- **Success Response:** `200 OK`
  ```json
  {
    "success": true,
    "message": "Medicines retrieved successfully!",
    "meta": {
      "total": 14,
      "page": 1,
      "totalPages": 14,
      "limit": 1,
      "skip": 0
    },
    "data": [
      {
        "id": "0b48b6c4-69d8-4c4a-97ed-681c76ea37fd",
        "slug": "generic-paracetamols-brand-napas",
        "brandName": "Napas",
        "genericName": "Paracetamols",
        "manufacturer": "Beximco Pharmaceuticals",
        "isFeatured": false,
        "strength": "500mg",
        "dosageForm": "TABLET",
        "unit": "Tablet",
        "packSize": 10,
        "dosageInfo": "1 tablet every 6–8 hours after meals",
        "price": 15,
        "piecePrice": 1.5,
        "stockQuantity": 6970,
        "expiryDate": "2027-06-30T00:00:00.000Z",
        "isActive": true,
        "createdAt": "2026-02-02T07:34:52.183Z",
        "updatedAt": "2026-02-04T06:18:19.833Z",
        "image": "https://example.com/images/napa.jpg",
        "description": "Used for the treatment of fever and mild to moderate pain such as headache, toothache, and body pain.",
        "category": {
          "id": "be520311-c544-4a74-a3f7-a90864ff5be2",
          "name": "Pain Relief",
          "slug": "pain-relief"
        }
      }
    ]
  }
  ```

#### 2. Get Medicine Details

- **Endpoint:** `/medicines/:id`
- **Method:** `GET`
- **Success Response:** `200 OK`
  ```json
  {
    "success": true,
    "message": "Medicine retrieved successfully!",
    "data": {
      "id": "1811eeaf-001c-47e7-9c89-2db20bcac521",
      "slug": "generic-omeprazole-brand-seclo",
      "brandName": "Seclo",
      "genericName": "Omeprazole",
      "manufacturer": "Square Pharmaceuticals",
      "isFeatured": false,
      "strength": "20mg",
      "dosageForm": "CAPSULE",
      "unit": "capsule",
      "packSize": 10,
      "dosageInfo": "1 capsule before breakfast",
      "price": 45,
      "piecePrice": 4.5,
      "stockQuantity": 170,
      "expiryDate": "2027-03-31T00:00:00.000Z",
      "isActive": true,
      "isDeleted": false,
      "deletedAt": null,
      "createdAt": "2026-02-02T07:34:52.523Z",
      "updatedAt": "2026-02-04T06:18:19.894Z",
      "image": "https://example.com/images/seclo.jpg",
      "description": "Reduces stomach acid and provides relief from gastric pain, heartburn, and acid reflux.",
      "seller": {
        "name": "First Seller",
        "email": "firstseller@gmail.com"
      },
      "category": {
        "id": "014e50b5-423f-4a28-85a7-3336c1219975",
        "name": "Digestive Health",
        "slug": "digestive-health"
      },
      "reviews": [
        {
          "id": "89630d91-24c0-4989-aae6-69d386a854a6",
          "rating": 5,
          "comment": "Very good service and product also good",
          "customer": {
            "name": "First User",
            "image": null
          },
          "createdAt": "2026-02-06T09:39:46.363Z"
        },
        {
          "id": "190bc848-a13a-423e-9985-207dc2f3c4c6",
          "rating": 5,
          "comment": "Very good service and product also good",
          "customer": {
            "name": "First User",
            "image": null
          },
          "createdAt": "2026-02-06T09:43:02.778Z"
        }
      ],
      "_count": {
        "reviews": 2,
        "orderItems": 6
      }
    }
  }
  ```
- **Error Response:** `404 Not Found` if ID doesn't exist.

---

### 📂 Categories

#### 1. Get Categories

- **Endpoint:** `/categories`
- **Method:** `GET`
- **Role:** Public
- **Success Response:** `200 OK`
  ```json
  {
    "success": true,
    "message": "Categories retrieved successfully!",
    "meta": {
      "total": 5,
      "page": 1,
      "totalPages": 5,
      "limit": 1,
      "skip": 0
    },
    "data": [
      {
        "id": "014e50b5-423f-4a28-85a7-3336c1219975",
        "slug": "digestive-health",
        "name": "Digestive Health",
        "image": "https://example.com/images/digestive-health.jpg",
        "isFeatured": false,
        "description": "Antacids, laxatives, and medicines for stomach and digestion issues.",
        "isActive": true,
        "createdAt": "2026-02-02T04:16:36.902Z",
        "updatedAt": "2026-02-02T04:16:36.902Z",
        "_count": {
          "medicines": 5
        }
      }
    ]
  }
  ```

#### 2. Create Category (Admin)

- **Endpoint:** `/admin/categories`
- **Method:** `POST`
- **Role:** **Admin**
- **Request Body:**
  ```json
  {
    "id": "014e50b5-423f-4a28-85a7-3336c1219975",
    "slug": "digestive-health",
    "name": "Digestive Health",
    "image": "https://example.com/images/digestive-health.jpg",
    "isFeatured": false,
    "description": "Antacids, laxatives, and medicines for stomach and digestion issues.",
    "isActive": true,
    "createdAt": "2026-02-02T04:16:36.902Z",
    "updatedAt": "2026-02-02T04:16:36.902Z",
    "_count": {
      "medicines": 5
    }
  }
  ```
- **Success Response:** `201 Created`
- **Frontend Mistake:** Dashboard allowing non-admins to try this.

---

### 🛒 Orders (Customer)

#### 1. Place Order

- **Endpoint:** `/orders`
- **Method:** `POST`
- **Role:** **Customer**
- **Request Body:**
  ```json
  {
    "shippingName": "First user first order",
    "shippingPhone": "012934394334",
    "shippingAddress": "Dhaka, Bangladesh",
    "shippingCity": "Dhaka",
    "shippingPostalCode": "1239",
    "orderItems": [
      {
        "medicineId": "0b48b6c4-69d8-4c4a-97ed-681c76ea37fd",
        "quantity": 10
      },
      {
        "medicineId": "1811eeaf-001c-47e7-9c89-2db20bcac521",
        "quantity": 160
      }
    ]
  }
  ```
- **Success Response:** `201 Created`
  ```json
  {
    "success": true,
    "message": "Order placed successfully",
    "data": {
      "id": "order_uuid",
      "orderNumber": "ORD-20241010-XYZ",
      "totalAmount": 550.0
      {...}
    }
  }
  ```
- **Error Responses:**
  - `400 Bad Request`: Stock insufficient for one or more items.
  - `400 Bad Request`: "Invalid shipping address".

#### 2. Get My Orders

- **Endpoint:** `/orders`
- **Method:** `GET`
- **Role:** **Customer**
- **Success Response:** `200 OK`
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "uuid",
        "orderNumber": "ORD-123",
        "totalAmount": 500,
        "status": "PLACED",
        "createdAt": "2024-10-10T10:00:00Z",
        "itemCount": 3
      }
    ]
  }
  ```

#### 3. Get Order Details

- **Endpoint:** `/orders/:id`
- **Method:** `GET`
- **Role:** **Customer**
- **Success Response:** `200 OK`
  ```json
  {
    "success": true,
    "data": {
      "id": "uuid",
      "orderNumber": "ORD-123",
      "status": "PROCESSING",
      "totalAmount": 500,
      "shippingAddress": { ... },
      "orderItems": [
        {
          "id": "item_uuid",
          "medicine": { "brandName": "Napa", "image": "..." },
          "quantity": 2,
          "unitPrice": 10.0,
          "status": "PROCESSING",
          "seller": { "name": "Pharmacy A" }
        }
      ]
    }
  }
  ```

---

### 🏪 Seller Management

#### 1. Add Medicine

- **Endpoint:** `/seller/medicines`
- **Method:** `POST`
- **Role:** **Seller**
- **Request Body:**
  ```json
  {
    "brandName": "Napa Extend",
    "genericName": "Paracetamol",
    "strength": "665mg",
    "dosageForm": "TABLET",
    "price": 2.5,
    "stockQuantity": 500,
    "categoryId": "cat_uuid",
    "image": "image_url",
    "description": "Extended release...",
    "expiryDate": "2026-01-01"
  }
  ```
- **Success Response:** `201 Created`

#### 2. Get My Inventory

- **Endpoint:** `/seller/medicines`
- **Method:** `GET`
- **Role:** **Seller**
- **Success Response:** `200 OK` (List/Pagination of own medicines)

#### 3. Get Seller Orders

- **Endpoint:** `/seller/orders`
- **Method:** `GET`
- **Role:** **Seller**
- **Description:** Returns order **items** assigned to this seller.
- **Success Response:** `200 OK`
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "order_item_uuid",
        "status": "PLACED",
        "medicine": { "brandName": "Napa" },
        "quantity": 5,
        "subTotal": 50.0,
        "order": {
          "orderNumber": "ORD-123",
          "shippingAddress": "..."
        }
      }
    ]
  }
  ```

#### 4. Update Order Item Status

- **Endpoint:** `/seller/orders/:item_id/status`
- **Method:** `PATCH`
- **Role:** **Seller**
- **Request Body:**
  ```json
  {
    "status": "SHIPPED" // PLACED -> PROCESSING -> SHIPPED -> DELIVERED
  }
  ```
- **Success Response:** `200 OK`
- **Error Response:** `400 Bad Request` if invalid transition (e.g., trying to cancel a delivered item).

---

### 🛡️ Admin

#### 1. Get All Users

- **Endpoint:** `/admin/users`
- **Method:** `GET`
- **Role:** **Admin**
- **Success Response:** `200 OK`
  ```json
  {
    "success": true,
    "data": [
      { "id": "uuid", "name": "User A", "role": "SELLER", "status": "ACTIVE" },
      { "id": "uuid", "name": "User B", "role": "CUSTOMER", "status": "BANNED" }
    ]
  }
  ```

#### 2. Update User Status

- **Endpoint:** `/admin/users/:id/status`
- **Method:** `PATCH`
- **Role:** **Admin**
- **Request Body:**
  ```json
  {
    "status": "BANNED" // or "ACTIVE"
  }
  ```
- **Success Response:** `200 OK`

---

## 7️⃣ ORDER FLOW

1.  **Cart:** Customer adds items locally (Context/Redux) or server-side cart (optional).
2.  **Checkout:** Customer fills shipping info.
3.  **Place Order:**
    - Frontend sends `items` + `shipping`.
    - Backend validates stock.
    - **Transaction:**
      - Deduct stock from `Medicine`.
      - Create `Order`.
      - Create `OrderItems`.
    - **Response:** Order ID.
4.  **Distribution:** Each `OrderItem` is linked to a Seller.
5.  **Fulfillment:**
    - Seller sees the order item in their dashboard.
    - Seller marks it `PROCESSING` -> `SHIPPED` -> `DELIVERED`.
    - _Simpler Flow:_ If Order is purely one seller, Order Status matches Item Status. If multi-seller, Order Status is aggregate.

---

## 8️⃣ ORDER STATUS ENUM

| Status       | Who Sets It?    | Meaning                                 |
| :----------- | :-------------- | :-------------------------------------- |
| `PLACED`     | System          | Validation passed, stock deducted.      |
| `PROCESSING` | Seller          | Seller has acknowledged and is packing. |
| `SHIPPED`    | Seller          | handed over to logistics/courier.       |
| `DELIVERED`  | Seller          | Customer received the item.             |
| `CANCELLED`  | Customer/Seller | Order voided. Stock usually returned.   |

**Validation:**

- Cannot cancel if `SHIPPED` or `DELIVERED`.
- Cannot move backwards (e.g., `DELIVERED` to `PLACED`).

---

## 9️⃣ REVIEWS & RATINGS LOGIC

- **Endpoint:** `POST /reviews`
- **Body:** `{ orderId, medicineId, rating: 5, comment: "Good" }`
- **Validation:**
  - User must have purchased `medicineId` in `orderId`.
  - `orderStatus` should be `DELIVERED`.
  - Only 1 review per medicine per order.
- **Aggregates:** On new review, backend optionally updates `Medicine.averageRating` cache or calculates on fly.

---

## 🔟 ADMIN CAPABILITIES

- **User Management:** Can Ban users (prevent login) or Unban.
- **Global View:** Can see ALL orders and ALL medicines.
- **Category Control:** Only admins can add new categories to keep the store organized.

---

## 1️⃣1️⃣ SELLER DASHBOARD DATA

- **Endpoint:** `GET /seller/stats`
- **Data:**
  - `totalOrders`: Count of order items.
  - `totalEarnings`: Sum of `subTotal` of delivered items.
  - `lowStockMedicines`: List of medicines with `stock < 10`.
- **Inventory Warnings:** Frontend should highlight medicines with low stock (e.g., generic logic `< 10`).

---

## 1️⃣2️⃣ ERROR HANDLING CONTRACT

**Format:**

```json
{
  "success": false,
  "message": "Human readable error message",
  "errorSources": [{ "path": "password", "message": "Password is too short" }],
  "stack": "..." // Only in development
}
```

**Common Codes:**

- `400 Bad Request`: Validation failure.
- `401 Unauthorized`: Not logged in / Invalid token.
- `403 Forbidden`: Logged in but wrong role.
- `404 Not Found`: Resource doesn't exist.
- `500 Internal Server Error`: Backend crash.

---

## 1️⃣3️⃣ FRONTEND INTEGRATION GUIDE

1.  **Service Layer:**
    - Create `src/services/auth.service.ts`, `medicine.service.ts`, etc.
    - Use `axios` or `fetch` interceptors to inject Auth Header automatically.
2.  **Auth State:**
    - Persist user info in `Context` or `Tanstack Query`.
    - Initialize state by calling.
3.  **Loading States:**
    - Always show spinners/skeletons while fetching.
4.  **Forms:**
    - Use `react-hook-form` + `zod` matching Backend validation.

---

## 1️⃣4️⃣ SECURITY & BEST PRACTICES

1.  **Tokens:** Store Auth Token in **HttpOnly Cookie** (safest) or `localStorage` (easier, vulnerable to XSS).
    - If `localStorage`: `Authorization: Bearer <token>`.
2.  **Role Validation:** Never trust the frontend checks. Backend always verifies role.
3.  **Input Sanitation:** Backend sanitizes inputs, but frontend should also validate types.
4.  **Sensitive Data:** Never display User info (email/phone) publicly on reviews or seller info unless intended.
