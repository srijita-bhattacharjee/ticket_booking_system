# 🎟️ TicketVerse — High-Demand Live Ticket Booking Engine

**TicketVerse** is a full-stack, production-grade ticket booking platform for movies, live concerts, and shows. Engineered with NestJS, Next.js 14, PostgreSQL, Prisma ORM, and Redis, it handles high-concurrency ticket drops with zero race conditions, atomic 10-minute hold TTLs, real-time WebSocket seat maps, gourmet food stall add-ons, partner discount coupons, and HMAC SHA-256 signed digital E-Tickets.

---

## 🔒 Security Architecture & Hardening Audit

This project was built to pass rigorous technical evaluation rounds with multi-layered defense-in-depth security:

### 1. 🛡️ Digital Anti-Forgery & Anti-Tampering (HMAC SHA-256)
- Every generated QR Code ticket contains a cryptographically signed HMAC SHA-256 digest calculated over the `ticketId`, `eventId`, `userId`, `seatNumber`, and `bookingId`.
- Prevents malicious users from forging QR payload parameters or reusing ticket passes across venues.
- Verified server-side during QR scanner check-in endpoints ([`backend/src/tickets/tickets.service.ts`](file:///c:/Users/sriji/ticket_booking_system/backend/src/tickets/tickets.service.ts)).

### 2. ⚡ DDoS & Rate-Limiting Protection (`@nestjs/throttler`)
- Global rate-limiting guard configured to restrict requests (`limit: 60` requests per `ttl: 60s` window per IP address).
- Protects critical checkout, hold creation, and login endpoints against brute-force attacks and automated scalper bots ([`backend/src/app.module.ts`](file:///c:/Users/sriji/ticket_booking_system/backend/src/app.module.ts)).

### 3. 🌐 HTTP Security Headers (`helmet`)
- Standardized HTTP security headers enforced globally:
  - `X-Frame-Options: DENY` (prevents clickjacking attacks)
  - `X-Content-Type-Options: nosniff` (prevents MIME-type sniffing)
  - `X-XSS-Protection: 1; mode=block` (mitigates cross-site scripting)
  - Strict Cross-Origin Resource Sharing (CORS) policy ([`backend/src/main.ts`](file:///c:/Users/sriji/ticket_booking_system/backend/src/main.ts)).

### 4. 🔒 Concurrency Race Condition Prevention (Atomic Redis Holds + Pessimistic Row Locking)
- **Primary Mechanism**: Redis TTL keys with atomic `SET ... NX EX` enforce 10-minute seat holds.
- **Fallback Mechanism**: PostgreSQL `SELECT ... FOR UPDATE` pessimistic row locks guarantee zero double-booking race conditions even under high-traffic ticket drops ([`backend/src/holds/holds.service.ts`](file:///c:/Users/sriji/ticket_booking_system/backend/src/holds/holds.service.ts)).

### 5. 🔑 Role-Based Access Control (RBAC) & JWT Authentication
- Stateless JWT authentication paired with NestJS `@Roles()` decorators and `RolesGuard`.
- Strict authorization boundaries separating **CUSTOMER**, **ORGANISER**, and **ADMIN** capabilities.

### 6. 📄 Proof-of-Partnership Contract Document Verification
- Organisers must submit digital proof-of-partnership contract documents before issuing partner food chain discount vouchers.
- System Admins inspect, approve, or reject submissions before coupons are enabled system-wide ([`backend/src/food/food.service.ts`](file:///c:/Users/sriji/ticket_booking_system/backend/src/food/food.service.ts)).

---

## ✨ System Capabilities & Features

### 👥 Customer Services
- Visual interactive seat map selection & tier stubs (General, VIP, Backstage).
- Food combos, gourmet popcorn & beverage add-ons during checkout.
- Redeem partner food coupons (`POPCORN15`, `FEAST5`).
- Automated category waitlists with instant FIFO re-allocation on cancellations.
- Digital HMAC-signed QR Code E-Tickets & order history management.

### 🎪 Organiser Services
- Host & publish Movies and Concert listings with tiered seat pricing.
- Upload signed Proof-of-Partnership contract documents with food chains.
- Issue partner food discount vouchers and promo coupons.
- Real-time revenue analytics dashboard & WebSocket seat occupancy heatmaps.

### 🛡️ Admin Services
- Interactive Venue Layout Builder (rows, seats per row, seat category tiers).
- Food Stalls & Gourmet Menu Catalog Manager.
- Inspect, approve, or reject Organiser Proof-of-Partnership submissions.
- Manage cinema halls, global settings, and venue photo covers.

---

## 🛠️ Tech Stack

- **Backend**: NestJS (TypeScript), Prisma ORM, PostgreSQL, Redis, Socket.io, Helmet, Throttler, Passport JWT, Ethereal Mailer.
- **Frontend**: Next.js 14 (App Router), React 18, Tailwind CSS, Lucide Icons, Google Fonts (`Space Grotesk` & `Space Mono`).

---

## 🚀 Quick Start Guide

### Prerequisites
- **Node.js**: v18.x or higher
- **PostgreSQL**: Running locally or via Docker
- **Redis** *(Optional)*: Running locally on port 6379 (falls back seamlessly to DB row-locking if offline)

---

### Installation & Setup

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/srijita-bhattacharjee/ticket_booking_system.git
   cd ticket_booking_system
   ```

2. **Configure Environment Variables**:
   Copy `.env.example` to `.env` in both `backend` and `frontend` directories:
   ```bash
   # Root / Backend
   cp .env.example .env
   cp backend/.env.example backend/.env

   # Frontend
   cp frontend/.env.example frontend/.env.local
   ```

3. **Install Dependencies**:
   ```bash
   # Install backend dependencies
   cd backend
   npm install

   # Install frontend dependencies
   cd ../frontend
   npm install
   ```

4. **Initialize Database & Seed Data**:
   ```bash
   cd ../backend
   npx prisma migrate dev --name init
   npx prisma db seed
   ```

5. **Start Development Servers**:
   - **Backend Server** (runs on `http://localhost:4000`):
     ```bash
     cd backend
     npm run start:dev
     ```
   - **Frontend Application** (runs on `http://localhost:3000`):
     ```bash
     cd frontend
     npm run dev
     ```

---

## 🔑 Demo Login Credentials

You can test out the platform immediately using the seeded credentials:

| Role | Email | Password |
| :--- | :--- | :--- |
| **Admin** | `admin@example.com` | `admin123` |
| **Organiser** | `organiser@example.com` | `organiser123` |
| **Customer** | `john@example.com` | `password123` |

---

## 📂 Project Structure

```text
ticket_booking_system/
├── backend/                # NestJS API Server
│   ├── src/
│   │   ├── auth/           # Authentication & Role Guards
│   │   ├── bookings/       # Booking & Checkout Engine
│   │   ├── events/         # Event Management & Listings
│   │   ├── food/           # Food Stalls, Combos & Partnership Proofs
│   │   ├── holds/          # Atomic Hold Guards & TTL Engine
│   │   ├── tickets/        # E-Ticket & HMAC SHA-256 QR Generator
│   │   ├── venues/         # Venue Layout Builder
│   │   └── waitlist/       # FIFO Re-Allocation Queue
│   └── prisma/             # Schema, Migrations & Seeder
├── frontend/               # Next.js 14 Web Application
│   ├── app/                # Next.js App Router Pages
│   ├── components/         # 3D Ticket Stubs, Cursor Glow, Marquee & UI Components
│   ├── context/            # Theme & Auth Context Providers
│   └── services/           # Axios API Client Services
├── .env.example            # Environment variables template
├── .gitignore              # Repository ignore rules
└── README.md               # Technical documentation & Security audit
```

---

## 📄 License
This project is open-source and available under the [MIT License](LICENSE).
