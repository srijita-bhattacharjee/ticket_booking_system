# 🎟️ TicketVerse — High-Demand Live Ticket Booking Engine

**TicketVerse** is a full-stack, production-grade ticket booking platform for movies, live concerts, and shows. Engineered with NestJS, Next.js 14, PostgreSQL, Prisma ORM, and Redis, it handles high-concurrency ticket drops with zero race conditions, atomic 10-minute hold TTLs, real-time WebSocket seat maps, gourmet food stall add-ons, partner discount coupons, Razorpay Standard Web Checkout, and HMAC SHA-256 signed digital E-Tickets.

---

## 🔒 Security Architecture & Hardening Audit

This project was built to pass rigorous technical evaluation rounds with multi-layered defense-in-depth security:

### 1. 🛡️ Cryptographic Payment Verification (Razorpay HMAC-SHA256)
- Integrates Razorpay Standard Web Checkout (`https://checkout.razorpay.com/v1/checkout.js`).
- Every payment completion requires server-side HMAC SHA-256 signature verification (`crypto.createHmac('sha256', KEY_SECRET)` over `order_id + '|' + payment_id`).
- Prevents payment spoofing or malicious order status manipulation ([`backend/src/bookings/bookings.service.ts`](file:///c:/Users/sriji/ticket_booking_system/backend/src/bookings/bookings.service.ts)).

### 2. 🛡️ Digital Anti-Forgery & Anti-Tampering (HMAC SHA-256 QR Tickets)
- Every generated QR Code ticket contains a cryptographically signed HMAC SHA-256 digest calculated over the `ticketId`, `eventId`, `userId`, `seatNumber`, and `bookingId`.
- Prevents malicious users from forging QR payload parameters or reusing ticket passes across venues.
- Verified server-side during QR scanner check-in endpoints ([`backend/src/tickets/tickets.service.ts`](file:///c:/Users/sriji/ticket_booking_system/backend/src/tickets/tickets.service.ts)).

### 3. ⚡ DDoS & Rate-Limiting Protection (`@nestjs/throttler`)
- Global rate-limiting guard configured to restrict requests (`limit: 60` requests per `ttl: 60s` window per IP address).
- Protects critical checkout, hold creation, and login endpoints against brute-force attacks and automated scalper bots ([`backend/src/app.module.ts`](file:///c:/Users/sriji/ticket_booking_system/backend/src/app.module.ts)).

### 4. 🌐 HTTP Security Headers (`helmet`)
- Standardized HTTP security headers enforced globally:
  - `X-Frame-Options: DENY` (prevents clickjacking attacks)
  - `X-Content-Type-Options: nosniff` (prevents MIME-type sniffing)
  - `X-XSS-Protection: 1; mode=block` (mitigates cross-site scripting)
  - Strict Cross-Origin Resource Sharing (CORS) policy ([`backend/src/main.ts`](file:///c:/Users/sriji/ticket_booking_system/backend/src/main.ts)).

### 5. 🔒 Concurrency Race Condition Prevention (Atomic Redis Holds + Row Locking)
- **Primary Mechanism**: Redis TTL keys with atomic `SET ... NX EX` enforce 10-minute seat holds.
- **Fallback Mechanism**: PostgreSQL `SELECT ... FOR UPDATE` pessimistic row locks guarantee zero double-booking race conditions even under high-traffic ticket drops ([`backend/src/holds/holds.service.ts`](file:///c:/Users/sriji/ticket_booking_system/backend/src/holds/holds.service.ts)).

### 6. 🔑 Role-Based Access Control (RBAC) & JWT Authentication
- Stateless JWT authentication paired with NestJS `@Roles()` decorators and `RolesGuard`.
- Strict authorization boundaries separating **CUSTOMER**, **ORGANISER**, and **ADMIN** capabilities.

### 7. 📄 Proof-of-Partnership Contract Document Verification
- Organisers must submit digital proof-of-partnership contract documents before issuing partner food chain discount vouchers.
- System Admins inspect, approve, or reject submissions before coupons are enabled system-wide ([`backend/src/food/food.service.ts`](file:///c:/Users/sriji/ticket_booking_system/backend/src/food/food.service.ts)).

---

## ✨ System Capabilities & Features

### 👥 Customer Services
- Visual interactive seat map selection & tier stubs (General, VIP, Backstage).
- Razorpay Standard Web Checkout with UPI (Google Pay, PhonePe, Paytm), Cards, and NetBanking.
- Public Offers & Coupons directory (`/offers`) with 1-click code copying.
- Food combos, gourmet popcorn & beverage add-ons during checkout.
- Redeem partner food coupons (`POPCORN15`, `FEAST5`).
- Automated category waitlists with instant FIFO re-allocation on cancellations.
- Digital HMAC-signed QR Code E-Tickets & order history management.

### 🎪 Organiser Services
- Create & publish event listings with tiered pricing and date pickers.
- Submit proof-of-partnership contract PDF/document uploads for food stalls.
- Create promotional discount coupons for approved food partners.
- Access real-time event analytics dashboard with seat occupancy heatmaps.

### 🛡️ Admin Services
- Venue Layout Builder (configure rows, columns, and total capacity).
- Audit and review submitted food stall partnership proofs (`APPROVED`, `REJECTED`).
- Manage system-wide food stalls, menu items, and venue assets.

---

## 🔑 Demo Login Credentials

For evaluators testing the application:

| Role | Email | Password | Capabilities |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@example.com` | `Password123!` | Venue builder, partnership proof approval, food stalls manager |
| **Organiser** | `organiser@example.com` | `Password123!` | Event creation, coupon manager, contract document upload |
| **Customer** | `john@example.com` | `Password123!` | Seat holds, checkout, food add-ons, Razorpay payments, QR tickets |

---

## ⚡ Quick Start & Setup

### 1. Prerequisites
- Node.js v18+
- PostgreSQL 14+
- Redis (Optional - Graceful fallback active)

### 2. Environment Variables Setup
Copy templates to active configuration files:
```bash
cp .env.example .env
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
```

### 3. Database Setup & Seeding
```bash
cd backend
npm install
npx prisma db push
npx prisma db seed
```

### 4. Running locally
```bash
# Terminal 1 - Backend API Server (Port 4000)
cd backend
npm run start:dev

# Terminal 2 - Frontend App (Port 3000)
cd frontend
npm run dev
```

Visit **`http://localhost:3000`** in your browser.

---

## 📂 Project Structure

```text
ticket_booking_system/
├── backend/                # NestJS API Server
│   ├── src/
│   │   ├── auth/           # Authentication & Role Guards
│   │   ├── bookings/       # Booking Engine & Razorpay Order/Verification
│   │   ├── events/         # Event Management & Listings
│   │   ├── food/           # Food Stalls, Combos & Partnership Proofs
│   │   ├── holds/          # Atomic Hold Guards & TTL Engine
│   │   ├── tickets/        # E-Ticket & HMAC SHA-256 QR Generator
│   │   ├── venues/         # Venue Layout Builder
│   │   └── waitlist/       # FIFO Re-Allocation Queue
│   └── prisma/             # Schema, Migrations & Seeder
├── frontend/               # Next.js 14 Web Application
│   ├── app/                # Next.js App Router Pages (/offers, /checkout, etc.)
│   ├── components/         # 3D Ticket Stubs, Razorpay Modal, UI Components
│   ├── context/            # Theme & Auth Context Providers
│   └── services/           # Axios API Client Services
├── .env.example            # Environment variables template
├── .gitignore              # Repository ignore rules
└── README.md               # Technical documentation & Security audit
```
