# 🎟️ Ticket Booking System — High-Demand Seat Booking Platform

A full-stack, production-grade ticket booking platform for movies and concerts built with **NestJS**, **Next.js (App Router)**, **PostgreSQL**, **Redis**, **BullMQ**, and **Socket.IO**.

Designed specifically to prevent race conditions during high-demand flash sales, enforce atomic 10-minute seat hold TTLs, deliver instant e-tickets with QR codes via background email workers, and provide intelligent automated category waitlists upon ticket cancellation.

---

## 🌟 Standout System Features

1. **Transaction-Safe Concurrency Guard**:
   - PostgreSQL pessimistic row-level locking (`SELECT ... FOR UPDATE`) prevents double-booking under extreme concurrent loads.
   - Redis fast lock guard (`SET NX EX 10`) drops duplicate requests before reaching database transaction pools.
2. **Atomic 10-Minute Seat Hold TTL**:
   - Selected seats enter an atomic 10-minute hold (`HELD`).
   - Dual-engine expiry (Redis key TTL + BullMQ delayed scheduler) releases abandoned seats back to `AVAILABLE`.
3. **Real-Time Visual Seat Map**:
   - Socket.IO WebSockets broadcast seat status changes (`seat.held`, `seat.released`, `seat.booked`) instantly to all connected browser clients.
4. **Automated Category Waitlist & 15-Minute Offer Cascade**:
   - When a booking is cancelled in a sold-out category (e.g. `PREMIUM`), the engine auto-assigns the freed seat to candidate **#1** in the FIFO waitlist and sends a time-limited 15-minute offer email.
   - If unclaimed after 15 minutes, the offer expires and cascades automatically to the next customer in queue.
5. **Cryptographic QR Code Ticket Delivery**:
   - Every confirmed booking produces an e-ticket with an embedded base64 QR code signed with HMAC SHA-256 containing booking references for venue gate check-in.
6. **Organiser Analytics & Seat Occupancy Heatmap**:
   - Organiser dashboard featuring total revenue tracking, ticket sales metrics, occupancy percentages, cancellation statistics, and interactive seat occupancy heatmap grids.

---

## 🏗️ Technology Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS, Socket.IO Client, Recharts, Lucide Icons
- **Backend**: NestJS (Node.js), TypeScript, REST API, WebSockets (Socket.IO Gateway), JWT Authentication, Role-Based Access Control (`CUSTOMER`, `ORGANISER`, `ADMIN`)
- **Database**: PostgreSQL (via Prisma ORM)
- **Cache & Locks**: Redis (`ioredis`) for TTL holds and distributed locking
- **Background Queues**: BullMQ & Nodemailer (Async HTML mailers with embedded QR codes)
- **Containerization**: Docker Compose

---

## 📁 Repository Structure

```
ticket-booking-system/
├── docker-compose.yml
├── .env.example
├── .env
├── README.md
├── package.json
├── docs/
│   ├── system-design-writeup.md  <-- Mandatory < 800 word evaluation write-up
│   ├── architecture.md
│   ├── database.md
│   ├── api.md
│   └── booking-logic.md
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── seed.ts
│   └── src/
│       ├── auth/                 (JWT & RBAC Guards)
│       ├── venues/               (Admin Venue Layout Editor)
│       ├── events/               (Catalog & Tiered Pricing)
│       ├── seats/                (Socket.IO Real-time Gateway)
│       ├── holds/                (Redis TTL & Row Locking)
│       ├── bookings/             (Idempotent Booking Gateway)
│       ├── waitlist/             (FIFO Queue & Smart Probability)
│       ├── tickets/              (QR Code Generator & Gate Check-in)
│       ├── notifications/        (Async Email Worker)
│       └── analytics/            (Organiser Revenue & Heatmap)
└── frontend/
    ├── app/
    │   ├── page.tsx              (Landing Page)
    │   ├── events/               (Catalog & Interactive Seat Map Grid)
    │   ├── checkout/             (10m Countdown Timer & Checkout)
    │   ├── bookings/             (Customer Booking History & Cancellation)
    │   ├── tickets/              (Digital QR Ticket & Scanner)
    │   ├── organiser/            (Revenue Analytics & Occupancy Heatmaps)
    │   └── admin/                (Venue & Seat Grid Layout Builder)
    ├── components/               (SeatMap, CountdownTimer, WaitlistCard, Heatmap)
    └── services/                 (Axios API Client)
```

---

## 🚀 Quickstart Guide (Local Setup)

### Prerequisites:
- Node.js (v18+)
- Docker & Docker Compose

### Step 1: Clone & Configure Environment
```bash
cp .env.example .env
```

### Step 2: Start PostgreSQL & Redis Infrastructure
```bash
docker-compose up -d
```
*(Spawns PostgreSQL on `localhost:5432` and Redis on `localhost:6379`)*

### Step 3: Install Dependencies & Run Database Seed
```bash
# Install backend dependencies & generate Prisma client
cd backend
npm install
npx prisma db push
npx prisma db seed

# Install frontend dependencies
cd ../frontend
npm install
```

### Step 4: Launch Applications
Run backend (Port `4000`) and frontend (Port `3000`):

```bash
# Terminal 1: Backend API & WebSocket Server
cd backend
npm run start:dev

# Terminal 2: Next.js Frontend
cd frontend
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔑 Demo Access Credentials

The database seed populates pre-configured test accounts for each role:

| Role | Email | Password | Access Capabilities |
| :--- | :--- | :--- | :--- |
| **Customer** | `john@example.com` | `Password123!` | Visual seat selection, 10m holds, QR tickets, cancellation |
| **Organiser** | `organiser@apexevents.com` | `Password123!` | Create event listings, view revenue metrics & seat heatmaps |
| **Admin** | `admin@ticketbooking.com` | `Password123!` | Create venues, configure seat rows and category tiers |

*(Use the 1-click preset buttons on the Login page for instant authentication)*

---

## 📖 Evaluation Documents & System Write-Ups

1. **[System Design Write-Up (Strictly <= 800 Words)](docs/system-design-writeup.md)**:
   Covers seat hold TTL, concurrency prevention, waitlist auto-assignment flow, and time-limited offer handling.
2. **[Architecture Specification](docs/architecture.md)**
3. **[Database Schema & Models](docs/database.md)**
4. **[REST & WebSocket API Guide](docs/api.md)**
5. **[Booking Logic & Concurrency State Machine](docs/booking-logic.md)**
