# High-Level Architecture — Ticket Booking System

## System Architecture Overview

The system implements a decoupled, modern three-tier web application architecture:

```
[ Next.js 14 Frontend ] <---> [ Socket.IO WebSockets ] <---> [ NestJS REST API Server ]
                                                                      │
                                                     ┌────────────────┴────────────────┐
                                                     ▼                                 ▼
                                            [ PostgreSQL DB ]                  [ Redis Cache & TTL ]
                                            Row Locking & Data                 Locks, Holds, Queues
```

---

## Technical Stack Breakdown

### Frontend:
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS (Glassmorphism Dark Theme)
- **State & Realtime**: Socket.IO Client, Custom React Hooks (`useAuth`, `useSocket`, `useSeatMap`)
- **Data Visualizations**: Recharts (Revenue analytics & seat occupancy heatmaps)

### Backend:
- **Framework**: NestJS (Node.js)
- **Database Layer**: Prisma ORM with PostgreSQL
- **Caching & Locking**: Redis (`ioredis`) for TTL holds & distributed locking guards
- **Queue & Async Processing**: BullMQ & Nodemailer for HTML ticket emails with inline QR codes
- **Authentication**: JWT Bearer Tokens with Role-Based Access Control (`CUSTOMER`, `ORGANISER`, `ADMIN`)

---

## Communication Protocols

1. **REST APIs (`/api/*`)**: Handles authentication, event catalogs, hold creation, bookings, waitlists, venue management, and analytics APIs.
2. **WebSockets (`ws://localhost:4000`)**: Real-time room-based communication broadcasting seat hold, release, and booking events to connected seat map clients.
