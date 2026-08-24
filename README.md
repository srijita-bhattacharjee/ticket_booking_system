# 🎟️ TicketVerse — High-Demand Live Ticket Booking & Event Engine

**TicketVerse** is a full-stack, enterprise-grade ticket booking platform for movies, live concerts, sports, theatre, comedy, workshops, games, exhibitions, and multi-day summits. Engineered with **NestJS**, **Next.js 14**, **PostgreSQL**, **Prisma ORM**, **Redis**, and **Socket.IO**, it powers high-concurrency ticket drops with zero race conditions, atomic 10-minute hold TTLs, dynamic resource layout selectors, automated category waitlist reallocation cascades, Razorpay HMAC-SHA256 Web Checkout, and HMAC-signed digital E-Tickets.

---

## 🏗️ 1. High-Level Architecture & Technology Stack

The platform is designed around a decoupled, asynchronous multi-tier web application architecture:

```text
                               ┌─────────────────────────────────────────┐
                               │       Next.js 14 Web Application        │
                               │   (App Router, TypeScript, Tailwind)    │
                               └────────────────────┬────────────────────┘
                                                    │
                                      ┌─────────────┴─────────────┐
                                      ▼                           ▼
                             [ REST API Requests ]     [ Socket.IO WebSockets ]
                                      │                           │
                                      └─────────────┬─────────────┘
                                                    │
                                                    ▼
                               ┌─────────────────────────────────────────┐
                               │           NestJS API Engine             │
                               │   (RBAC Guards, Throttler, Services)    │
                               └────────────────────┬────────────────────┘
                                                    │
                                   ┌────────────────┴────────────────┐
                                   ▼                                 ▼
                         [ PostgreSQL Database ]            [ Redis Cache & Locks ]
                         Row Locking & Data Store           Atomic Holds & SET NX EX
```

### 💻 Stack Breakdown

- **Frontend Application**:
  - **Framework**: Next.js 14 (App Router)
  - **Language**: TypeScript
  - **Styling**: Vanilla CSS tokens & Tailwind CSS (Glassmorphism Light `#f5edf5` & Dark themes)
  - **State & Realtime**: Socket.IO Client, Custom Hooks (`useAuth`, `useSocket`, `useSeatMap`)
  - **Visualizations**: Recharts (Revenue analytics & seat occupancy heatmaps)

- **Backend Microservice**:
  - **Framework**: NestJS (Node.js)
  - **Database & ORM**: Prisma ORM with PostgreSQL
  - **Caching & Locking**: Redis (`ioredis`) for TTL holds & distributed locking guards
  - **Async Queues**: BullMQ & Nodemailer for HTML ticket emails with inline QR codes
  - **Security & Auth**: JWT Bearer Tokens with Role-Based Access Control (`CUSTOMER`, `ORGANISER`, `ADMIN`)

---

## ⚡ 2. Booking Logic, Hold TTL & Concurrency Protection Engine

### 2.1 Seat & Resource State Machine

```text
                 ┌──────────────┐
                 │  AVAILABLE   │
                 └──────┬───────┘
                        │
                  Hold Requested
                        │
                        ▼
                 ┌──────────────┐
  TTL Expired ┌──┤     HELD     ├──┐ Checkout Complete
              │  └──────────────┘  │
              ▼                    ▼
     ┌────────────────┐    ┌──────────────┐
     │   AVAILABLE    │    │    BOOKED    │
     └────────────────┘    └──────┬───────┘
                                  │
                          Booking Cancelled
                                  │
                                  ▼
                        ┌──────────────────┐
                        │  WAITLIST OFFER  │
                        └─────────┬────────┘
                                  │
                        ┌─────────┴────────┐
         Offer Expired  │                  │ Offer Accepted
                        ▼                  ▼
              ┌──────────────────┐  ┌──────────────┐
              │ NEXT WAITLIST    │  │    BOOKED    │
              │ USER OFFER       │  └──────────────┘
              └──────────────────┘
```

### 2.2 Dual-Layer Concurrency Guard

During high-demand ticket sales, thousands of users may attempt to select the same seat simultaneously. TicketVerse employs **dual-layer protection** to eliminate double-booking:

1. **Layer 1 — Fast Distributed Lock Guard (Redis)**:
   Before entering the database transaction, Redis acquires an atomic lock key `seat-lock:{eventId}:{seatId}` using `SET key value EX 10 NX`. If another request holds the Redis lock, the request immediately returns `409 Conflict`, shielding PostgreSQL from connection pool exhaustion.
2. **Layer 2 — PostgreSQL Pessimistic Row Locking (Ground Truth)**:
   Inside a PostgreSQL `$transaction`, candidate rows in `event_seats` are queried using `SELECT id, status FROM event_seats WHERE id IN (...) FOR UPDATE`. Row locking guarantees strict serializability. If two requests pass Redis simultaneously, DB lock ordering ensures only one transaction reads `AVAILABLE` and commits `HELD`; the second evaluates `status = HELD` and aborts cleanly.

```sql
BEGIN TRANSACTION;

SELECT id, status FROM event_seats
WHERE id IN ('seat_1', 'seat_2')
FOR UPDATE;

-- Verify status = 'AVAILABLE'
-- Insert hold record in `holds`
-- Update event_seats SET status = 'HELD'

COMMIT;
```

### 2.3 Seat Hold Expiration & Auto-Release
1. **Hold Creation**: Client sends `POST /api/holds` with `eventId` and `seatIds`.
2. **Atomic Reservation**: Status transitions from `AVAILABLE` to `HELD` with a 10-minute timestamp (`expiresAt = now + 10 mins`).
3. **Redis TTL & Backup Worker**: A Redis key `hold:{holdId}` is initialized with 600-second TTL (`EX 600`) alongside a BullMQ delayed worker.
4. **Auto-Release Execution**: If checkout is abandoned, the expiration handler reverts all associated `HELD` seats back to `AVAILABLE`.
5. **Real-Time Map Broadcasting**: Socket.IO broadcasts a `seat.released` WebSocket event to the `event:{eventId}` room, instantly updating seat colors on all connected clients.

---

## ⏳ 3. Automated Category Waitlist Reallocation Cascade

When an event category (e.g., `PREMIUM` or `STANDARD`) sells out, customers can join a category-specific **FIFO waitlist**.

```text
[Booking Cancelled] ──► [Freed Seat] ──► [Select FIFO Position #1 Waitlist User]
                                                    │
                                                    ▼
                                    [Generate 15-Min Offer Token]
                                                    │
                                                    ▼
                                    [Send Email + WS Notification]
```

1. **Cancellation Event**: When a confirmed booking is cancelled via `DELETE /api/bookings/:id`, the seats transition to `AVAILABLE`, and the backend queries `waitlist_entries` for the corresponding `eventId` and `category`.
2. **FIFO Candidate Selection**: The highest-priority customer (`position ASC`, `status = WAITING`) is selected.
3. **Offer Generation**: System creates a `waitlist_offers` record containing a unique `offerToken` with `expiresAt = now + 15 mins`. The target seat is reserved `HELD` for the candidate.
4. **Smart Probability Calculation**:
   $$\text{Probability} = \min\left(95, \max\left(5, \left\lceil \frac{\text{Total Seats} \times 0.10}{\text{Queue Position}} \right\rceil \times 100 \right)\right)$$
5. **Acceptance or Expiration Cascade**:
   - **Acceptance**: User hits `POST /api/waitlist/offers/accept`. The offer converts into an active 10-minute hold and proceeds to checkout.
   - **Expiration Cascade**: If the 15-minute window elapses without acceptance, BullMQ workers mark the offer `EXPIRED` and automatically execute the reallocation workflow for candidate **#2** in the queue.

---

## 📊 4. Entity Relationship & Database Schema

```text
[User] 1 ──< [Hold] 1 ──< [HoldSeat] >── 1 [EventSeat] >── 1 [VenueSeat] >── 1 [Venue]
  │           │                               │
  │ 1 ──< [Booking] 1 ──< [BookingSeat] ──────┘
  │           │
  │           └── 1 ──< [Ticket]
  │
  └── 1 ──< [WaitlistEntry] 1 ──< [WaitlistOffer]
```

### Core Database Models (`prisma/schema.prisma`)
- **`User`**: Authentication profile (`email`, `passwordHash`, `role`: `CUSTOMER`, `ORGANISER`, `ADMIN`).
- **`Venue` & `VenueHall`**: Physical venues and indoor space auditoriums.
- **`VenueSeat`**: Physical seat layouts (`rowNumber`, `seatNumber`, `category`: `VIP`, `PREMIUM`, `STANDARD`, `ACCESSIBLE`).
- **`Event`**: Activity listings mapped to `ActivityType` and `BookingModel` with `resourceConfig` JSON payload.
- **`EventSeat`**: Per-show seat state tracking (`AVAILABLE`, `HELD`, `BOOKED`) with category prices.
- **`Hold` & `HoldSeat`**: Active 10-minute seat reservations.
- **`Booking` & `BookingSeat`**: Confirmed purchases with `idempotencyKey` and Razorpay transaction IDs.
- **`Ticket`**: Digital passes with gate check-in status (`VALID`, `CHECKED_IN`, `CANCELLED`) and HMAC signatures.
- **`Wishlist`**: Customer saved event bookmarks.

---

## 🎯 5. Activity Types & Resource Booking Models Matrix

The system provides a dynamic 11-step progressive creation wizard (`/organiser/events/create`) that configures specialized resource layouts based on the selected activity and booking model:

| Activity Type | Supported Booking Models | Resource Layout & Visual Interface |
| :--- | :--- | :--- |
| **Cinema** | `SEAT` | Standard rectangular seat grid (VIP, Premium, Standard, Accessible) |
| **Theatre** | `SEAT`, `TABLE`, `CUSTOM` | Irregular auditorium layouts, orchestra pits, balcony tiers, VIP boxes |
| **Concert** | `GENERAL_ADMISSION`, `SEAT` | Standing general admission zones (VIP Pit, Main Floor) & gate entry |
| **Workshop** | `CAPACITY`, `SLOT`, `SEAT` | Participant capacity limits, registration cutoffs, learning materials |
| **Sports** | `SEAT`, `GENERAL_ADMISSION`, `TEAM` | Spectator stands, VIP boxes, team registration limits |
| **Game** | `SLOT`, `TEAM`, `CAPACITY` | Timed game session slots (11:00–12:00, 13:00–14:00) with player caps |
| **Exhibition** | `PASS`, `GENERAL_ADMISSION`, `SLOT` | Multi-day delegate passes (3-Day VIP All Access, 1-Day Delegate Pass) |
| **Conference** | `PASS`, `SEAT`, `CAPACITY` | Auditorium map seating, keynotes, delegate badges |
| **Amusement** | `SLOT`, `CAPACITY`, `GENERAL_ADMISSION` | Hourly throughput slots, operating hours, day passes |
| **Other** | `TABLE`, `CUSTOM` | Fine dining cabaret & comedy club tables (4-Seater VIP, 2-Seater Couples) |

---

## 🔒 6. Security Architecture & Hardening Audit

### 1. 🛡️ Cryptographic Payment Verification (Razorpay HMAC-SHA256)
- Every payment completion requires server-side HMAC SHA-256 signature verification (`crypto.createHmac('sha256', KEY_SECRET)` over `order_id + '|' + payment_id`).
- Prevents payment spoofing or malicious order status manipulation ([`backend/src/bookings/bookings.service.ts`](file:///c:/Users/sriji/ticket_booking_system/backend/src/bookings/bookings.service.ts)).

### 2. 🛡️ Digital Anti-Forgery & Anti-Tampering (HMAC-SHA256 QR Tickets)
- Every generated QR Code ticket contains a cryptographically signed HMAC SHA-256 digest calculated over the `ticketId`, `eventId`, `userId`, `seatNumber`, and `bookingId`.
- Prevents malicious users from forging QR payload parameters or reusing ticket passes across venues ([`backend/src/tickets/tickets.service.ts`](file:///c:/Users/sriji/ticket_booking_system/backend/src/tickets/tickets.service.ts)).

### 3. ⚡ Rate Limiting & DDoS Protection (`@nestjs/throttler`)
- Global rate-limiting guard configured to restrict requests (`limit: 60` requests per `ttl: 60s` window per IP address).
- Protects critical checkout, hold creation, and login endpoints against brute-force attacks ([`backend/src/app.module.ts`](file:///c:/Users/sriji/ticket_booking_system/backend/src/app.module.ts)).

### 4. 🌐 Security Headers (`helmet`)
- Enforces `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `X-XSS-Protection`, and strict CORS policies ([`backend/src/main.ts`](file:///c:/Users/sriji/ticket_booking_system/backend/src/main.ts)).

---

## 🤖 7. TicketBot & RAG Architecture

TicketBot operates as a system-grounded AI assistant:

```text
User Message ──► Intent Extraction ──► RAG Static Policy Check ──► Live DB Seat Verification ──► Tool Execution
```

- **Static Grounding via RAG**: RAG indexes static application knowledge, FAQs, activity descriptions, and refund policies (`backend/src/chatbot/rag.service.ts`).
- **Live Backend Verification**: TicketBot NEVER presents cached vector data as live availability. Real-time availability is queried directly from PostgreSQL.
- **Existing Concurrency Engine Re-use**: Booking actions triggered via assistant reuse the existing atomic Redis hold guards and PostgreSQL row locks.

---

## 📡 8. REST API Endpoints Specification

### 🔑 Authentication API (`/api/auth`)
- `POST /api/auth/register`: Register new user (`CUSTOMER`, `ORGANISER`, `ADMIN`)
- `POST /api/auth/login`: Authenticate and receive JWT access token
- `GET /api/auth/me`: Get current authenticated profile

### 🎟️ Events API (`/api/events`)
- `GET /api/events`: List events with optional `type` filter and `search` query
- `GET /api/events/:id`: Get event details, seats, and resource layout config
- `POST /api/events`: Create new activity listing (Organiser / Admin)
- `DELETE /api/events/:id`: Delete event listing

### ⏳ Holds API (`/api/holds`)
- `POST /api/holds`: Place 10-minute hold on selected seats
- `GET /api/holds/:id`: Get hold details and remaining TTL countdown
- `DELETE /api/holds/:id`: Manually release seat hold

### 💳 Bookings API (`/api/bookings`)
- `POST /api/bookings`: Create confirmed booking from valid hold (Supports `Idempotency-Key` header)
- `POST /api/bookings/create-order`: Generate Razorpay order ID
- `POST /api/bookings/verify-payment`: Verify HMAC SHA-256 payment signature
- `GET /api/bookings`: List user booking history
- `GET /api/bookings/:id`: Get booking details
- `DELETE /api/bookings/:id`: Cancel booking (Triggers waitlist offer cascade)

### ⏳ Waitlist API (`/api/waitlist`)
- `POST /api/waitlist`: Join FIFO category waitlist for sold-out event
- `GET /api/events/:id/waitlist/status`: Get user waitlist position & probability estimate
- `POST /api/waitlist/offers/accept`: Accept 15-minute waitlist offer token

### 🏷️ Wishlist API (`/api/wishlist`)
- `POST /api/wishlist/:eventId`: Toggle event saved status
- `GET /api/wishlist/ids`: List array of wishlisted event IDs
- `GET /api/wishlist`: List user's saved wishlist events

### 🎟️ Tickets API (`/api/tickets`)
- `GET /api/tickets/:id`: Get digital ticket details & base64 QR code
- `POST /api/tickets/:id/check-in`: Gate scanner check-in endpoint (Organiser / Admin)

### 📊 Organiser & Admin API
- `GET /api/organiser/dashboard`: Organiser revenue & ticket metrics summary
- `GET /api/organiser/events/:id/heatmap`: Seat occupancy heatmap matrix
- `GET /api/admin/venues`: List venues and seat layouts
- `POST /api/admin/venues`: Create venue and auditorium halls

---

## 🔑 9. Demo Login Credentials

For evaluators testing the application:

| Role | Email | Password | Capabilities |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@example.com` | `Password123!` | Venue builder, partnership proof approval, food stalls manager |
| **Organiser** | `organizer@example.com` | `Password123!` | 11-step progressive creation wizard, analytics, coupon manager |
| **Customer** | `customer@example.com` | `Password123!` | Seat map holds, resource selectors, checkout, wishlist, QR tickets |

---

## 🚀 10. Quick Start & Setup Guide

### 1. Prerequisites
- Node.js v18+
- PostgreSQL 14+
- Redis (Optional — Graceful fallback active)

### 2. Environment Setup
```bash
cp .env.example .env
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
```

### 3. Database Seeding
```bash
cd backend
npm install
npx prisma db push
npx prisma db seed
```

### 4. Launch Application
```bash
# Terminal 1 — Backend API Server (Port 4000)
cd backend
npm run start:dev

# Terminal 2 — Next.js 14 Frontend App (Port 3000)
cd frontend
npm run dev
```

Visit **`http://localhost:3000`** in your browser.

---

## 🌐 11. Production Deployment & Live Demo

The platform has been fully hardened and deployed to production.

- **Live URL**: **[https://ticketverse.up.railway.app](https://ticketverse.up.railway.app)**
- **API Health Endpoint**: **[https://ticketbookingsystem-production-f5c9.up.railway.app/api/health](https://ticketbookingsystem-production-f5c9.up.railway.app/api/health)**
- **Detailed Step-by-Step Guide**: Read the [Production Deployment Guide](file:///C:/Users/sriji/.gemini/antigravity-ide/brain/9418946f-11a6-411a-a562-494cb958dbfb/deployment_guide.md) for full instructions on setting up Neon, Supabase, Upstash, and Railway configurations.

### Production Hardening Features Implemented:
1. **Dynamic CORS Whitelisting:** Backend automatically restricts HTTP/WebSocket origins using `ALLOWED_ORIGINS` and `FRONTEND_URL` environment variables.
2. **Reverse Proxy Trust:** Configured `trust proxy 1` to ensure correct client IP mapping behind load balancers for rate-limiters.
3. **Response Compression:** Integrated standard gzip compression to reduce transfer payloads by ~70%.
4. **Health Check Probes:** Implemented a `/api/health` controller to monitor database sync status and node uptime during rolling redeploys.
5. **Standalone Next.js Config:** Enabled Docker-ready standalone server builds optimized for container engines.

