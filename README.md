# ShopNova — Full-Stack E-Commerce Website

A complete, production-style e-commerce platform with a React frontend and a Node/Express/MongoDB backend. Real frontend ↔ backend communication throughout — no mocked core flows.

**Stack:** React 18 · Vite · React Router 6 · Tailwind CSS · Axios · Context API · Node.js · Express · MongoDB/Mongoose · JWT · bcryptjs · Multer

---

## 1. Project Folder Structure

```text
ecommerce-store/
├── README.md
├── docker-compose.yml              # one-command local MongoDB (docker compose up -d)
├── client/                          # Frontend (React + Vite)
│   ├── package.json
│   ├── vite.config.js               # dev proxy: /api + /uploads → localhost:5000
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── index.html
│   └── src/
│       ├── main.jsx                 # React entry
│       ├── App.jsx                  # Provider nesting + router
│       ├── index.css                # Tailwind + shared utilities
│       ├── api/                     # Thin Axios wrappers (return {success,message,data})
│       │   ├── axios.js             # baseURL /api, JWT interceptor, error normalization
│       │   ├── index.js             # barrel export
│       │   ├── authApi.js           # register, login, me
│       │   ├── productApi.js        # list, details, featured, related…
│       │   ├── categoryApi.js
│       │   ├── cartApi.js
│       │   ├── wishlistApi.js
│       │   ├── orderApi.js
│       │   ├── reviewApi.js
│       │   ├── couponApi.js
│       │   ├── userApi.js           # profile, addresses, password
│       │   └── adminApi.js          # dashboard, products, orders, customers, coupons
│       ├── context/
│       │   ├── AuthContext.jsx      # user, token (localStorage), isAdmin, login/logout
│       │   ├── CartContext.jsx      # items, count, totals (login-gated)
│       │   ├── WishlistContext.jsx  # optimistic toggle
│       │   └── ToastContext.jsx     # success/error/info toasts
│       ├── components/
│       │   ├── Navbar.jsx           # search, badges, user menu, mobile hamburger
│       │   ├── Footer.jsx
│       │   ├── Hero.jsx
│       │   ├── Newsletter.jsx
│       │   ├── Reviews.jsx          # testimonials
│       │   ├── CategoryCard.jsx
│       │   ├── ProductCard.jsx      # discount %, rating, stock badge, wishlist, add-to-cart
│       │   ├── Rating.jsx           # star display
│       │   ├── Filters.jsx          # category/brand/price/rating/stock/size/color
│       │   ├── Pagination.jsx
│       │   ├── Skeleton.jsx         # skeleton loaders
│       │   ├── EmptyState.jsx
│       │   ├── ErrorState.jsx
│       │   ├── Loader.jsx
│       │   ├── Toast.jsx
│       │   ├── ConfirmDialog.jsx    # destructive-action confirmations
│       │   ├── ProtectedRoute.jsx
│       │   ├── AdminRoute.jsx       # role === 'admin' gate
│       │   ├── AdminSidebar.jsx
│       │   ├── StatCard.jsx
│       │   └── Chart.jsx            # pure-SVG bar/line/donut charts
│       ├── pages/
│       │   ├── Home.jsx             # hero, categories, featured/best/new, promo, reviews
│       │   ├── Shop.jsx             # URL-synced search/filter/sort/pagination + mobile drawer
│       │   ├── ProductDetails.jsx   # gallery, variants, qty, reviews + form, related
│       │   ├── Login.jsx / Register.jsx
│       │   ├── Cart.jsx             # qty controls, coupon, totals
│       │   ├── Checkout.jsx         # addresses, delivery + payment, order summary
│       │   ├── OrderConfirmation.jsx
│       │   ├── Orders.jsx / OrderDetails.jsx  # 6-step tracking timeline
│       │   ├── Profile.jsx          # 5 tabs: profile/orders/addresses/wishlist/settings
│       │   ├── Wishlist.jsx
│       │   └── Admin/
│       │       ├── Dashboard.jsx    # 6 stat cards + 4 charts
│       │       ├── Products.jsx     # CRUD + multi-image upload
│       │       ├── Categories.jsx
│       │       ├── Orders.jsx       # filters + status updates + detail drawer
│       │       ├── Customers.jsx    # search + enable/disable
│       │       ├── Coupons.jsx
│       │       └── Inventory.jsx    # low-stock alerts + quick adjust
│       ├── routes/AppRoutes.jsx
│       ├── hooks/useDebounce.js
│       └── utils/
│           ├── format.js            # currency, dates, imgUrl (+ placeholder fallback)
│           ├── constants.js         # order statuses, payment/delivery methods, sort options
│           └── sampleData.js        # API-failure fallback only (Home/Shop)
│
└── server/                          # Backend (Node + Express + MongoDB)
    ├── package.json                 # scripts: dev, start, seed
    ├── .env.example
    ├── server.js                    # app entry: CORS, JSON, /uploads static, routes, 404 + errors
    ├── config/db.js                 # Mongoose connect
    ├── utils/
    │   ├── asyncHandler.js          # async wrapper
    │   ├── ApiError.js
    │   └── ApiResponse.js           # consistent { success, message, data }
    ├── middleware/
    │   ├── auth.js                  # protect: JWT Bearer → req.user
    │   ├── admin.js                 # authorizeAdmin: role gate
    │   ├── errorHandler.js          # CastError / 11000 / ValidationError / Multer
    │   └── upload.js                # Multer disk storage, 5MB image-only, auto-creates uploads/
    ├── models/                      # Mongoose schemas (see §4)
    │   ├── User.js / Category.js / Product.js / Cart.js
    │   ├── Wishlist.js / Order.js / Review.js / Coupon.js
    ├── controllers/                 # business logic (see §6)
    │   ├── authController.js / userController.js / productController.js
    │   ├── categoryController.js / cartController.js / wishlistController.js
    │   ├── orderController.js / reviewController.js / couponController.js
    │   └── adminController.js
    ├── routes/                      # Express routers mounted under /api/* (see §5)
    │   ├── auth.js / users.js / products.js / categories.js / cart.js
    │   ├── wishlist.js / orders.js / reviews.js / coupons.js / admin.js
    ├── seed/seed.js                 # 6 categories, 32 products, reviews, coupons, users
    └── uploads/                     # uploaded images (gitignored, served statically)
```

---

## 2. Setup & Installation

### Prerequisites
- **Node.js** 18+ and npm
- **MongoDB** — one of: a local install, a MongoDB Atlas URI, or Docker Desktop
  (with Docker, you can skip installing MongoDB: `docker compose up -d` from the
  project root starts one on `localhost:27017` with persistent storage; `docker compose down` stops it)

### Backend

```bash
cd server
cp .env.example .env
# Edit .env → set MONGO_URI and a strong JWT_SECRET
# (the default MONGO_URI already points at the Docker MongoDB above, no change needed)
npm install
npm run seed     # seeds categories, 32 products, coupons, admin + demo users (needs MongoDB up)
npm run dev      # nodemon on http://localhost:5000
```

### Frontend

```bash
cd client
npm install
npm run dev      # Vite on http://localhost:5173 (proxies /api + /uploads → :5000)
```

### Commands summary

| Where | Command | What it does |
|---|---|---|
| `server/` | `npm install` | install backend deps |
| `server/` | `npm run seed` | seed DB (idempotent-ish: clears + inserts) |
| `server/` | `npm run dev` | start API with nodemon |
| `server/` | `npm start` | start API with node |
| `client/` | `npm install` | install frontend deps |
| `client/` | `npm run dev` | start Vite dev server |
| `client/` | `npm run build` | production build → `dist/` |
| `client/` | `npm run preview` | preview production build |

### Environment variables (`server/.env`)

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/ecommerce
JWT_SECRET=your-strong-secret-here
JWT_EXPIRE=7d
CLIENT_URL=http://localhost:5173
NODE_ENV=development
```

Never commit `.env`. Secrets stay server-side only.

### Seed accounts

| Role | Email | Password |
|---|---|---|
| Admin | `admin@shop.com` | `Admin123!` |
| Demo user | `user@shop.com` | `User123!` |

Seed coupons: `WELCOME10` (10% off), `SAVE20` (20% off, min order), `FREESHIP` (free shipping).

---

## 3. How the Frontend Communicates with the Backend

```text
React component
   ↓  calls thin wrapper (src/api/*.js)
Axios instance (src/api/axios.js)
   ↓  baseURL '/api' (Vite proxies → http://localhost:5000 in dev)
   ↓  Request interceptor: attaches `Authorization: Bearer <token>` from localStorage
Express router (/api/*)
   ↓  middleware: protect (JWT) → authorizeAdmin (role) → validation
Controller
   ↓  Mongoose
MongoDB
   ↓  consistent JSON { success, message, data } + proper HTTP status
Axios response interceptor normalizes errors → ToastContext shows user-friendly message
Context (Auth/Cart/Wishlist) updates → UI re-renders
```

Key points:
- **JWT** is stored in `localStorage['token']`; the Axios interceptor attaches it to every request. `AuthContext` restores the session on reload via `GET /api/auth/me`.
- **All core flows hit the real API** — login, products, cart, wishlist, orders, reviews, coupons, admin. No mocked checkout or fake auth.
- **The frontend never decides prices.** Cart/checkout send product IDs + quantities; the server re-fetches prices, validates stock, applies coupons, and computes `subtotal + shipping + tax − discount = total`.
- **Image uploads** use `FormData` (Axios skips the JSON content-type for it); Multer stores files under `server/uploads/`, served statically and proxied by Vite at `/uploads`.
- **Defensive parsing:** pages accept `products`/`items`/bare arrays and nested or flat pagination shapes, so UI stays robust.

---

## 4. Database Models (Mongoose)

| Model | Key fields |
|---|---|
| **User** | username, email (unique), password (bcrypt 10 rounds, `comparePassword()`), role `user\|admin`, phone, avatar, `addresses[]` {label, fullName, phone, address, city, state, postalCode, country, isDefault}, isActive |
| **Category** | name, slug (auto), description, image |
| **Product** | name, slug (auto), description, price, originalPrice, discount %, category (ref), brand, images[], stock, sizes[], colors[], rating, numReviews, featured, bestSeller, isNew, specifications, text index on name/description/brand |
| **Cart** | user (ref, unique), items[] {product (ref), quantity, size, color, price snapshot} |
| **Wishlist** | user (ref, unique), products[] (refs, duplicate-guarded) |
| **Order** | user (ref), orderId (unique, generated), items[] {product, name, image, price @purchase, quantity, size, color}, shippingAddress{}, paymentMethod `cod\|card\|bank`, paymentStatus, orderStatus `pending→confirmed→processing→shipped→out_for_delivery→delivered` (+`cancelled`), subtotal, shipping (Rs 150 standard / Rs 350 express, free ≥ Rs 5000), tax 5%, discount, total, coupon {code, discount}, timeline[] |
| **Review** | user (ref), product (ref), rating 1–5, comment — unique per user+product; only verified purchasers can post |
| **Coupon** | code (unique, uppercase), discountType `percent\|fixed`, discountValue, minOrderAmount, maxDiscount, expiresAt, usageLimit, usedCount, isActive |

---

## 5. Backend API Routes

All return `{ success, message, data }` with proper status codes. Routes marked 🔒 need JWT; 👑 need admin role.

```text
GET    /api/health                         # liveness check

# Auth
POST   /api/auth/register                  # username, email, password
POST   /api/auth/login                     # email, password → { token, user }
GET    /api/auth/me                   🔒   # current user
POST   /api/auth/logout               🔒

# Users
GET    /api/users/profile             🔒
PUT    /api/users/profile             🔒   # name, phone, avatar upload
PUT    /api/users/password            🔒   # current + new password
GET    /api/users/addresses           🔒
POST   /api/users/addresses           🔒
PUT    /api/users/addresses/:id       🔒
DELETE /api/users/addresses/:id       🔒
PUT    /api/users/addresses/:id/default 🔒

# Products (public reads)
GET    /api/products                       # ?search=&category=&brand=&minPrice=&maxPrice=
                                           #  &minRating=&inStock=&size=&color=&sort=&page=&limit=
GET    /api/products/featured
GET    /api/products/best-sellers
GET    /api/products/new-arrivals
GET    /api/products/:id                   # id or slug
GET    /api/products/:id/related
POST   /api/products                  👑   # multipart images
PUT    /api/products/:id              👑
DELETE /api/products/:id              👑

# Categories
GET    /api/categories
GET    /api/categories/:id
POST   /api/categories                👑   # multipart image
PUT    /api/categories/:id            👑
DELETE /api/categories/:id            👑   # blocked if products exist

# Cart  🔒 (all)
GET    /api/cart
POST   /api/cart                           # { productId, quantity, size, color }
PUT    /api/cart/:itemId                   # { quantity }
DELETE /api/cart/:itemId
DELETE /api/cart                           # clear

# Wishlist  🔒 (all)
GET    /api/wishlist
POST   /api/wishlist                       # { productId }
DELETE /api/wishlist/:productId

# Orders  🔒
POST   /api/orders                         # { shippingAddress, deliveryMethod, paymentMethod, couponCode }
GET    /api/orders/my                     # own orders
GET    /api/orders/:id                    # own order (or 👑 any)
PUT    /api/orders/:id/cancel         🔒   # own pending order → restores stock

# Reviews
GET    /api/reviews/product/:productId
POST   /api/reviews                    🔒  # { productId, rating, comment } — purchase-verified
PUT    /api/reviews/:id                🔒  # own review
DELETE /api/reviews/:id                🔒

# Coupons
POST   /api/coupons/validate           🔒  # { code, subtotal } → discount preview
GET    /api/coupons                   👑
POST   /api/coupons                   👑
PUT    /api/coupons/:id               👑
DELETE /api/coupons/:id               👑

# Admin  👑 (all)
GET    /api/admin/dashboard                # stats + charts data
GET    /api/admin/orders                   # ?status=&from=&to=&search=&payment=
PUT    /api/admin/orders/:id/status        # update order status (+ timeline)
GET    /api/admin/users                    # ?search=&page=
GET    /api/admin/users/:id                # user + their orders
PUT    /api/admin/users/:id/toggle-active  # enable/disable (can't disable self)
```

---

## 6. Controllers & Middleware

**Controllers** (`server/controllers/`): `authController` (register/login with disabled-account check, JWT issue), `userController` (profile, avatar, addresses, password, admin user mgmt), `productController` (search/filter/sort/pagination, slug-or-ID lookup, featured/best/new/related), `categoryController` (delete blocked when products exist), `cartController` (variant-aware merge, stock checks), `wishlistController` (duplicate guard), `orderController` (server-side totals, stock verify + decrement, coupon apply, cart clear, cancel with restore), `reviewController` (purchase-verified, rating recompute), `couponController` (validate + CRUD), `adminController` (dashboard aggregations: 30-day sales/orders with zero-fill, best-sellers, revenue-by-category).

**Middleware** (`server/middleware/`): `protect` (JWT Bearer → `req.user`, 401 on missing/invalid), `authorizeAdmin` (403 unless `role === 'admin'`), `errorHandler` (maps CastError/duplicate-key/ValidationError/Multer limits to clean messages), `upload` (Multer disk storage, image-only filter, 5 MB limit).

---

## 7. Security

- Passwords hashed with **bcryptjs** (10 rounds); never stored or returned in plaintext (`select('-password')` everywhere).
- **JWT** (7-day expiry via env) in `Authorization: Bearer` header; `protect` middleware on all private routes.
- **Role-based authorization**: `/api/admin/*` and admin product/category/coupon mutations require `role === 'admin'`.
- **Server-side pricing**: order totals recalculated from DB prices; stock re-verified; coupon validated server-side. Frontend totals are display-only.
- **Input validation** on auth, products, orders, reviews, coupons; consistent error envelope.
- **CORS** restricted to `CLIENT_URL`; secrets only in `.env` (`.env.example` provided, nothing hardcoded).
- No raw card data stored — card payments are structured for a future gateway integration.

---

## 8. Features Checklist

**Storefront:** responsive navbar (search, wishlist/cart badges, user menu, mobile drawer) · hero · categories · featured / best sellers / new arrivals · promo banner · testimonials · newsletter · footer · shop with search/filter/sort/pagination · product details (gallery, variants, qty, specs, reviews, related) · cart (coupons, totals) · checkout (saved addresses, delivery + payment methods) · order confirmation · order tracking timeline · profile (5 tabs) · wishlist · toasts, skeletons, empty/error states, confirm dialogs.

**Admin (`/admin`, 👑):** dashboard (sales, orders, customers, products, pending, low-stock + 4 charts) · product CRUD with image uploads · category CRUD (delete protection) · order management (filters, status updates, detail drawer) · customer search + enable/disable · coupon CRUD · inventory alerts + quick stock adjust.

**Order flow:** validate cart → verify stock → recalculate totals server-side → apply coupon → create order (unique orderId) → decrement stock → clear cart → confirmation page → status timeline (`pending → confirmed → processing → shipped → out_for_delivery → delivered`, plus `cancelled` with stock restore).

---

## 9. Seed Data

`server/seed/seed.js` creates:
- **6 categories**: Men's Fashion, Women's Fashion, Electronics, Shoes, Accessories, Home & Lifestyle
- **32 realistic products** (PKR pricing): brands, discounts, stock levels, sizes/colors, specifications, `featured` / `bestSeller` / `isNew` flags
- **24 reviews** with recomputed product ratings
- **3 coupons**: `WELCOME10`, `SAVE20`, `FREESHIP`
- **Users**: admin (`admin@shop.com` / `Admin123!`), demo (`user@shop.com` / `User123!`), plus a few sample customers

Run with `npm run seed` from `server/` (requires MongoDB running).

---

## 10. Verification Notes

- Backend: all route imports statically verified against controller exports; `node --check` passes on every file; consistent `{success,message,data}` envelope confirmed.
- Frontend: `npm run build` compiles cleanly (149 modules, zero errors); all core flows call the live API (no mocked auth/cart/orders).
- **Not yet runtime-tested here** (no MongoDB in this environment). After `npm install` + `npm run seed` with MongoDB up, smoke-test: register → login → add to cart → apply coupon → checkout → view order → admin updates status → review product.

---

## 11. Troubleshooting

| Symptom | Fix |
|---|---|
| `MONGO_URI` connection fails | Start MongoDB (`mongod`) or use an Atlas URI in `server/.env` |
| Frontend shows network errors | Ensure backend is on `:5000` (`npm run dev` in `server/`) — Vite proxies `/api` there |
| Images 404 | Backend serves `server/uploads/` statically; Vite proxies `/uploads` → `:5000` |
| 401 on protected routes | Token expired/cleared — log in again; check `localStorage['token']` |
| Admin pages redirect | Only `role: 'admin'` users can access `/admin` — log in as `admin@shop.com` |
| Port in use | Change `PORT` in `server/.env` and the Vite proxy target in `client/vite.config.js` |
