# API Specification — Ticket Booking System

## Endpoints Reference

### Auth API
- `POST /api/auth/register`: Register new user (`CUSTOMER`, `ORGANISER`, `ADMIN`)
- `POST /api/auth/login`: Authenticate and receive JWT access token
- `GET /api/auth/me`: Get current authenticated profile

### Events API
- `GET /api/events`: List events with optional `type` filter and `search` query
- `GET /api/events/:id`: Get event details and current seat grid status
- `POST /api/events`: Create new event listing (Organiser / Admin)
- `DELETE /api/events/:id`: Delete event listing

### Holds API
- `POST /api/holds`: Place 10-minute hold on selected seats
- `GET /api/holds/:id`: Get hold details and remaining TTL
- `DELETE /api/holds/:id`: Manually release seat hold

### Bookings API
- `POST /api/bookings`: Create confirmed booking from valid hold (Supports `Idempotency-Key` header)
- `GET /api/bookings`: List user booking history
- `GET /api/bookings/:id`: Get booking details
- `DELETE /api/bookings/:id`: Cancel booking (Triggers waitlist offer cascade)

### Waitlist API
- `POST /api/waitlist`: Join FIFO category waitlist for sold-out event
- `GET /api/events/:id/waitlist/status`: Get user waitlist position & probability estimate
- `POST /api/waitlist/offers/accept`: Accept 15-minute waitlist offer token

### Tickets API
- `GET /api/tickets/:id`: Get digital ticket details & base64 QR code
- `POST /api/tickets/:id/check-in`: Gate scanner check-in endpoint (Organiser / Admin)

### Organiser Analytics API
- `GET /api/organiser/dashboard`: Organiser metrics summary (Revenue, tickets sold, occupancy %)
- `GET /api/organiser/events/:id/heatmap`: Seat occupancy heatmap matrix
