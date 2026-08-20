# System Design Write-Up — Ticket Booking System

## Overview
This document details the architectural mechanisms governing concurrency protection, temporary seat hold expiration (TTL), automated category waitlist reallocation, and time-limited offer management for high-demand ticket sales.

---

## 1. Seat Hold TTL and Auto-Release Mechanism

When a customer selects seats on the visual grid, the system places a temporary **10-minute hold** to reserve the seats during checkout.

### Execution Flow:
1. **Hold Creation**: Client sends `POST /api/holds` with `eventId` and `seatIds`.
2. **Atomic State Transition**: Within a PostgreSQL transaction, candidate seats in `event_seats` are locked using `SELECT ... FOR UPDATE`. If status is `AVAILABLE`, the system updates status to `HELD` and inserts a record in `holds`.
3. **Redis TTL & Backup Scheduler**:
   - A Redis key `hold:{holdId}` is set with a 600-second expiration (`EX 600`).
   - A BullMQ delayed job is scheduled for `now + 10 minutes` as a fail-safe fallback to guarantee seat release even if Redis keyspace events are delayed.
4. **Auto-Release Execution**:
   - When the 10-minute window elapses without booking completion, the expiration handler updates the hold status to `EXPIRED` and reverts all associated `HELD` seats back to `AVAILABLE`.
5. **Real-Time Map Synchronization**:
   - A Socket.IO WebSocket Gateway immediately broadcasts a `seat.released` event to the `event:{eventId}` room. Connected frontends dynamically update seat colors from amber (held) to green (available) without requiring a page refresh.

---

## 2. Concurrency Protection for Simultaneous Selection

In flash sales, thousands of users may select the exact same seat concurrently. The system employs **dual-layer protection** to prevent double-booking.

### Dual-Layer Locking Architecture:
- **Layer 1 (Fast Distributed Lock Guard)**:
  - Before entering the database transaction, Redis acquires an atomic lock key `seat-lock:{eventId}:{seatId}` using `SET key value EX 10 NX`.
  - If another request holds the Redis lock, the request immediately fails fast with HTTP `409 Conflict`, shielding PostgreSQL from connection pool exhaustion.
- **Layer 2 (PostgreSQL Pessimistic Row-Level Lock - Ground Truth)**:
  - Inside PostgreSQL `$transaction`, targeted rows in `event_seats` are queried using `SELECT id, status FROM event_seats WHERE id IN (...) FOR UPDATE`.
  - Row locking guarantees strict serializability. If two requests pass Redis simultaneously, DB lock ordering ensures only one transaction reads `AVAILABLE` and commits `HELD`; the second transaction evaluates `status = HELD` and aborts cleanly.
- **Booking Idempotency**:
  - `POST /api/bookings` accepts an `Idempotency-Key` header cached in Redis (`idempotency:{key}`). Duplicate retries due to network blips return the original booking object without re-executing transactions.

---

## 3. Waitlist Auto-Assignment and Time-Limited Offer Flow

When an event category (e.g., `PREMIUM` or `STANDARD`) sells out, customers can join a category-specific **FIFO waitlist**.

### Automatic Reallocation Pipeline:
```
[Booking Cancelled] ──► [Freed Seat] ──► [Select FIFO Position #1 Waitlist User]
                                                    │
                                                    ▼
                                    [Generate 15-Min Offer Token]
                                                    │
                                                    ▼
                                    [Send Email + WS Notification]
```

1. **Cancellation Event Trigger**: When a confirmed booking is cancelled via `DELETE /api/bookings/:id`, the seats transition to `AVAILABLE`, and the backend inspects `waitlist_entries` for the corresponding `eventId` and `category`.
2. **FIFO Candidate Selection**: The system queries the active waitlist sorted by `position ASC` to select the highest-priority customer (`status = WAITING`).
3. **Offer Generation & Seat Reserve**:
   - System creates a `waitlist_offers` record containing a cryptographically unique `offerToken` and sets `expiresAt = now + 15 minutes`.
   - The candidate seat is marked `HELD` to reserve it exclusively for that offer recipient.
   - Entry status transitions to `OFFERED`.
4. **Time-Limited Claiming**:
   - An automated email containing the direct offer link (`/events/:id?offerToken=...`) is dispatched via background mailers.
5. **Acceptance or Cascade Expiration**:
   - **Acceptance**: Customer hits `POST /api/waitlist/offers/accept`. System verifies token validity, converts the offer into an active 10-minute hold, and transitions waitlist entry to `FULFILLED`.
   - **Expiration Cascade**: If the 15-minute window expires without acceptance, BullMQ background workers mark the offer `EXPIRED` and automatically execute the reallocation workflow for candidate **#2** in the queue.

---

## 4. Summary Matrix

| Mechanism | Primary Data Store | Backup / Lock Guard | Real-Time Notification |
| :--- | :--- | :--- | :--- |
| **Seat Hold TTL** | Redis Key TTL (600s) | BullMQ Delayed Job | Socket.IO `seat.released` |
| **Concurrency Lock** | PostgreSQL `FOR UPDATE` | Redis `SET NX` Lock | Socket.IO `seat.held` |
| **Waitlist Reallocation** | PostgreSQL FIFO Queue | 15-Min Offer Expiry Worker | Socket.IO `waitlist.offer_created` |
| **Booking Idempotency** | Redis Cache Key (24h) | Unique DB Key Guard | QR Email Ticket Dispatch |
