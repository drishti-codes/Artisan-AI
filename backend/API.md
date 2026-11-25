# ArtisanAI API

Base URL: `http://localhost:5000/api`

Every response looks like `{ "success": true, "message": "...", "data": ... }` or `{ "success": false, "message": "...", "errors": [...] }`.
Requests marked **Login** need the header `Authorization: Bearer <token>` (get the token from `/auth/login`).

## Auth

| Method | URL | Login needed | Notes |
|---|---|---|---|
| POST | `/auth/register` | No | Register (customer). Role is always customer. Returns token + user. |
| POST | `/auth/login` | No | Login (customer). Saves the token automatically in Postman. |
| POST | `/auth/login` | No | Login (artisan demo). Use the SEED_ARTISAN_PASSWORD from your .env. |
| POST | `/auth/login` | No | Login (admin demo). Use the SEED_ADMIN_PASSWORD from your .env. |
| GET | `/auth/me` | Yes | Me. Current user (no password). |

**Register (customer)** body:
```json
{
  "name": "Test User",
  "email": "test@example.com",
  "password": "Pass1234"
}
```

**Login (customer)** body:
```json
{
  "email": "test@example.com",
  "password": "Pass1234"
}
```

**Login (artisan demo)** body:
```json
{
  "email": "ramesh-kumar@artisanai.demo",
  "password": "YOUR_SEED_ARTISAN_PASSWORD"
}
```

**Login (admin demo)** body:
```json
{
  "email": "admin@artisanai.demo",
  "password": "YOUR_SEED_ADMIN_PASSWORD"
}
```

## Catalog

| Method | URL | Login needed | Notes |
|---|---|---|---|
| GET | `/categories` | No | Categories. All categories. |
| GET | `/artisans` | No | Artisans list.  |
| GET | `/artisans/ramesh-kumar` | No | Artisan details.  |
| GET | `/artisans/ramesh-kumar/products` | No | Artisan products.  |
| POST | `/artisans/ramesh-kumar/follow` | Yes | Follow / unfollow artisan. Toggles. Returns { following, followersCount }. |
| GET | `/stories` | No | Stories list.  |
| GET | `/stories/woman-who-weaves-dreams` | No | Story details. Includes the artisan object. |

## Products

| Method | URL | Login needed | Notes |
|---|---|---|---|
| GET | `/products` | No | Products list (filters). Query: q, category, region, material, minPrice, maxPrice, sort (featured|price-asc|price-desc|rating), page, limit. |
| GET | `/products/blue-pottery-vase` | No | Product details. Adds 1 view. |
| GET | `/products/blue-pottery-vase/related` | No | Related products.  |
| POST | `/products` | Yes | Create product (artisan). Artisan login needed. |
| PATCH | `/products/hand-painted-terracotta-pot` | Yes | Update product (artisan). Owner only. |
| DELETE | `/products/hand-painted-terracotta-pot` | Yes | Delete product (artisan). Soft delete (hidden). |

**Create product (artisan)** body:
```json
{
  "name": "Hand-painted Terracotta Pot",
  "category": "pottery",
  "price": 950,
  "stock": 10,
  "description": "A hand-painted pot.",
  "image": "https://example.com/pot.jpg",
  "gallery": [
    "https://example.com/pot.jpg"
  ],
  "materials": "Terracotta clay"
}
```

**Update product (artisan)** body:
```json
{
  "price": 999,
  "stock": 12
}
```

## Cart

| Method | URL | Login needed | Notes |
|---|---|---|---|
| GET | `/cart` | Yes | Get cart. Returns items, count, subtotal. |
| POST | `/cart/items` | Yes | Add to cart.  |
| PATCH | `/cart/items/blue-pottery-vase` | Yes | Change quantity.  |
| POST | `/cart/merge` | Yes | Merge guest cart after login. Send the localStorage cart. |
| DELETE | `/cart/items/blue-pottery-vase` | Yes | Remove item.  |
| DELETE | `/cart` | Yes | Clear cart.  |

**Add to cart** body:
```json
{
  "productId": "blue-pottery-vase",
  "qty": 2
}
```

**Change quantity** body:
```json
{
  "qty": 3
}
```

**Merge guest cart after login** body:
```json
{
  "items": [
    {
      "id": "blue-pottery-vase",
      "qty": 1
    }
  ]
}
```

## Orders

| Method | URL | Login needed | Notes |
|---|---|---|---|
| POST | `/orders` | Yes | Create order from cart. Prices are recalculated on the server. Shipping Rs 200. Copy the returned id for payment. The cart is cleared only after payment. |
| GET | `/orders` | Yes | My orders.  |
| GET | `/orders/ORDER_ID_HERE` | Yes | Order details / tracking. Includes statusHistory. |

**Create order from cart** body:
```json
{
  "address": {
    "name": "Drishti Jha",
    "line1": "12 MG Road",
    "city": "Indore",
    "pincode": "452001",
    "phone": "9876543210"
  },
  "paymentMethod": "upi"
}
```

## Payments

| Method | URL | Login needed | Notes |
|---|---|---|---|
| POST | `/payments/create-order` | Yes | Create payment. Mock mode returns {mode:"mock"}; Razorpay mode returns the Razorpay order. |
| POST | `/payments/verify` | Yes | Verify Razorpay payment. Only in PAYMENT_MODE=razorpay. |
| POST | `/payments/mock-confirm` | Yes | Mock confirm (DEMO ONLY). Only in PAYMENT_MODE=mock. Marks the order paid and reduces stock. |

**Create payment** body:
```json
{
  "orderId": "ORDER_ID_HERE"
}
```

**Verify Razorpay payment** body:
```json
{
  "orderId": "ORDER_ID_HERE",
  "razorpay_order_id": "order_xxx",
  "razorpay_payment_id": "pay_xxx",
  "razorpay_signature": "signature"
}
```

**Mock confirm (DEMO ONLY)** body:
```json
{
  "orderId": "ORDER_ID_HERE"
}
```

## Seller (artisan login)

| Method | URL | Login needed | Notes |
|---|---|---|---|
| GET | `/seller/products` | Yes | My products.  |
| GET | `/seller/orders` | Yes | Seller orders. Only my items in paid orders. |
| PATCH | `/seller/orders/ORDER_ID_HERE/status` | Yes | Update order status. processing | shipped | delivered. |
| GET | `/seller/inventory` | Yes | Inventory. Shows lowStock flag. |
| PATCH | `/seller/inventory/blue-pottery-vase` | Yes | Update stock.  |

**Update order status** body:
```json
{
  "status": "shipped"
}
```

**Update stock** body:
```json
{
  "stock": 15
}
```

## Payment modes
`PAYMENT_MODE=mock` (default): use `/payments/mock-confirm` (demo only). `PAYMENT_MODE=razorpay`: use `/payments/create-order` then `/payments/verify` with Razorpay test keys.
