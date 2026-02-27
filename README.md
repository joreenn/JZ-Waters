# JZ Waters - Water Refilling Station & Delivery Management System

A comprehensive full-stack web application for managing a water refilling station with delivery services, built with **Next.js**, **Node.js/Express**, and **MySQL**.

---

## Features

### 4 User Roles
- **Admin** — Full system management (dashboard, users, products, orders, inventory, deliveries, zones, reports, settings)
- **Refiller** — Log walk-in refill transactions, view daily summaries
- **Delivery Driver** — Manage assigned deliveries, update delivery status in real-time
- **Customer** — Browse products, place orders, track deliveries, manage subscriptions, earn loyalty points

### 12+ Modules
1. **Authentication** — JWT-based login/register, forgot/reset password, role-based access
2. **Admin Dashboard** — Summary cards, sales charts, recent transactions, low stock alerts
3. **User Management** — Create staff accounts, search/filter, toggle active status
4. **Product Management** — CRUD with categories, stock tracking, reorder levels
5. **Order Management** — Full order lifecycle, assign delivery drivers, status updates
6. **Refill Module** — Log walk-in transactions, daily revenue summary
7. **Delivery Module** — Route-optimized by zone, real-time status tracking
8. **Inventory** — Stock levels, movement logs, low stock alerts
9. **Sales Reports** — Date range filtering, daily/weekly/monthly grouping, CSV & PDF export
10. **Delivery Zones** — Area-based delivery fees, minimum order amounts
11. **Loyalty Points** — Earn points on orders, redeem at checkout
12. **Subscriptions** — Recurring deliveries (daily/weekly/biweekly/monthly) with auto-generation
13. **Notifications** — In-app real-time notifications via Socket.io
14. **Settings** — Store info, operating hours, loyalty config, notification preferences

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14, React 18, Tailwind CSS 3.4 |
| Backend | Node.js, Express.js |
| Database | MySQL (via XAMPP) |
| Auth | JWT (jsonwebtoken + bcryptjs) |
| Real-time | Socket.io |
| Charts | Recharts |
| Icons | Lucide React |
| Email | Nodemailer |
| Cron Jobs | node-cron |
| Export | PDFKit (PDF), csv-writer (CSV) |

---

## Prerequisites

- **Node.js** v18+ ([Download](https://nodejs.org/))
- **XAMPP** with MySQL running ([Download](https://www.apachefriends.org/))
- **Git** (optional)

---

## Installation & Setup

### 1. Clone / Navigate to Project
```bash
cd "c:\xampp\htdocs\New JzWaters"
```

### 2. Install Dependencies
```bash
# Install all dependencies (root + server + client)
npm install
cd server && npm install && cd ..
cd client && npm install && cd ..
```

### 3. Start MySQL
Open **XAMPP Control Panel** and start **MySQL** (default port 3306).

### 4. Set Up Database
```bash
cd server
node scripts/setup-db.js
```
This creates the `jzwaters` database and all required tables.

### 5. Seed Sample Data (Optional)
```bash
node scripts/seed-db.js
```
This adds sample users, products, zones, and transactions.

### 6. Run the Application
```bash
# From root directory
cd ..
npm run dev
```
This starts both the server (port 5000) and client (port 3000) concurrently.

Or run them separately:
```bash
# Terminal 1 - Backend
cd server && npm run dev

# Terminal 2 - Frontend
cd client && npm run dev
```

### 7. Open in Browser
- **Frontend**: http://localhost:3000
- **API Health**: http://localhost:5000/api/health

---

## Test Accounts

After running the seed script, use these credentials:

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@jzwaters.com | password123 |
| Refiller | refiller@jzwaters.com | password123 |
| Delivery | delivery1@jzwaters.com | password123 |
| Customer | juan@email.com | password123 |

---

## Environment Variables

### Server (`server/.env`)
```env
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=jzwaters
DB_PORT=3306
JWT_SECRET=jzwaters_jwt_secret_key_2024
JWT_EXPIRES_IN=7d
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
MAIL_FROM=JZ Waters <noreply@jzwaters.com>
STORE_NAME=JZ Waters
STORE_PHONE=09XX-XXX-XXXX
STORE_ADDRESS=Your Address
LOYALTY_POINTS_PER_PESO=0.1
LOYALTY_PESO_PER_POINT=0.1
LOYALTY_MIN_REDEEM=100
```

### Client (`client/.env.local`)
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_WS_URL=http://localhost:5000
NEXT_PUBLIC_APP_NAME=JZ Waters
```

---

## Project Structure

```
New JzWaters/
├── package.json              # Root with concurrently scripts
├── shared/
│   ├── constants.js          # Enums, roles, statuses
│   └── helpers.js            # Validation & formatting utilities
├── server/
│   ├── package.json
│   ├── .env
│   ├── scripts/
│   │   ├── setup-db.js       # Database & table creation
│   │   └── seed-db.js        # Sample data seeder
│   └── src/
│       ├── index.js           # Express + Socket.io entry point
│       ├── config/
│       │   └── database.js    # MySQL connection pool
│       ├── middleware/
│       │   ├── auth.js        # JWT auth + role authorization
│       │   └── errorHandler.js
│       ├── services/
│       │   ├── emailService.js
│       │   └── notificationService.js
│       ├── cron/
│       │   └── subscriptions.js
│       └── routes/
│           ├── auth.js
│           ├── users.js
│           ├── products.js
│           ├── refills.js
│           ├── orders.js
│           ├── deliveries.js
│           ├── inventory.js
│           ├── dashboard.js
│           ├── zones.js
│           ├── notifications.js
│           ├── settings.js
│           ├── subscriptions.js
│           └── loyalty.js
└── client/
    ├── package.json
    ├── .env.local
    ├── next.config.js
    ├── tailwind.config.js
    └── src/
        ├── styles/globals.css
        ├── lib/
        │   ├── api.js         # Axios with JWT interceptor
        │   └── socket.js      # Socket.io client
        ├── contexts/
        │   ├── AuthContext.js
        │   └── CartContext.js
        ├── components/
        │   ├── layout/
        │   │   ├── Navbar.js
        │   │   ├── AdminSidebar.js
        │   │   ├── AdminLayout.js
        │   │   └── StaffLayout.js
        │   └── ui/
        │       ├── LoadingSpinner.js
        │       ├── EmptyState.js
        │       ├── StatusBadge.js
        │       └── Modal.js
        └── pages/
            ├── _app.js
            ├── _document.js
            ├── index.js           # Landing page
            ├── login.js
            ├── register.js
            ├── forgot-password.js
            ├── reset-password.js
            ├── products.js        # Product browsing
            ├── cart.js
            ├── checkout.js
            ├── profile.js
            ├── notifications.js
            ├── subscriptions.js
            ├── loyalty.js
            ├── refiller.js        # Refiller dashboard
            ├── delivery.js        # Delivery driver dashboard
            ├── orders/
            │   ├── index.js       # Customer order list
            │   └── [id].js        # Order detail
            └── admin/
                ├── index.js       # Admin dashboard
                ├── orders.js
                ├── users.js
                ├── products.js
                ├── inventory.js
                ├── deliveries.js
                ├── zones.js
                ├── reports.js
                └── settings.js
```

---

## API Endpoints

### Auth
- `POST /api/auth/register` — Customer registration
- `POST /api/auth/login` — Login (returns JWT)
- `GET /api/auth/me` — Get current user
- `PUT /api/auth/profile` — Update profile
- `PUT /api/auth/change-password` — Change password
- `POST /api/auth/forgot-password` — Request reset email
- `POST /api/auth/reset-password` — Reset with token

### Products
- `GET /api/products` — Public product listing
- `GET /api/products/admin/all` — All products (admin)
- `POST /api/products` — Create product (admin)
- `PUT /api/products/:id` — Update product (admin)
- `DELETE /api/products/:id` — Delete product (admin)
- `POST /api/products/:id/adjust-stock` — Stock adjustment (admin)

### Orders
- `GET /api/orders` — List orders (role-filtered)
- `GET /api/orders/:id` — Order detail
- `POST /api/orders` — Create order (customer)
- `PUT /api/orders/:id/status` — Update status

### Deliveries
- `GET /api/deliveries` — List deliveries
- `GET /api/deliveries/unassigned` — Unassigned orders
- `POST /api/deliveries/assign` — Assign driver
- `PUT /api/deliveries/:id/status` — Update delivery status

### More
See route files in `server/src/routes/` for complete API documentation.

---

## License

This project is for educational and commercial use. Built for JZ Waters.
