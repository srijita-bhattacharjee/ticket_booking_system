# Booking Logic & Seat State Machine — Ticket Booking System

## Seat State Machine Diagram

```
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

## Key Algorithms

### 1. Concurrency Protection
Row-level pessimistic locking via PostgreSQL transaction:
```sql
BEGIN TRANSACTION;

SELECT id, status FROM event_seats
WHERE id IN ('seat_1', 'seat_2')
FOR UPDATE;

-- Verify status = 'AVAILABLE'
-- Insert hold record
-- Update event_seats SET status = 'HELD'

COMMIT;
```

### 2. Smart Waitlist Probability Calculator
Formula predicting seat allocation probability for waitlisted users:
$$\text{Probability} = \min\left(95, \max\left(5, \left\lceil \frac{\text{Total Seats} \times 0.10}{\text{Queue Position}} \right\rceil \times 100 \right)\right)$$
- If position = 1, probability is set to 85%.
- Levels: High (>= 70%), Moderate (40-69%), Low (< 40%).
