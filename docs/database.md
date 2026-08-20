# Database Schema & Data Models — Ticket Booking System

## Entity Relationship Summary

```
[User] 1 ──< [Hold] 1 ──< [HoldSeat] >── 1 [EventSeat] >── 1 [VenueSeat] >── 1 [Venue]
  │           │                               │
  │ 1 ──< [Booking] 1 ──< [BookingSeat] ──────┘
  │           │
  │           └── 1 ──< [Ticket]
  │
  └── 1 ──< [WaitlistEntry] 1 ──< [WaitlistOffer]
```

## Core Tables & Specifications

1. **`users`**: Customer, Organiser, and Admin user accounts.
2. **`venues`**: Physical venue properties created by Admin.
3. **`venue_seats`**: Base seat layout grid for a venue (`row_number`, `seat_number`, `category`: `PREMIUM` / `STANDARD`).
4. **`events`**: Shows created by Organisers tied to a venue, date, time, and category pricing.
5. **`event_seats`**: Per-show seat state tracking (`AVAILABLE`, `HELD`, `BOOKED`) with `price` and `version` counters.
6. **`holds`**: Active temporary holds created by customers with 10-minute `expires_at` timestamps.
7. **`bookings`**: Confirmed bookings with unique `booking_reference` and `idempotency_key`.
8. **`waitlist_entries`**: Category-based FIFO queue entries for sold-out shows.
9. **`waitlist_offers`**: 15-minute time-limited seat booking offer tokens generated upon booking cancellation.
10. **`tickets`**: QR token tickets issued upon booking confirmation with gate check-in status (`VALID`, `CHECKED_IN`, `CANCELLED`).
