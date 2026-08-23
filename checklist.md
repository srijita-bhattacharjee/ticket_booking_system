# Ticket Booking Platform --- Implementation Update Checklist

> **Scope:** Update the existing ticket-booking platform so that
> venue/resource configuration is activity-specific, TicketBot is
> grounded by RAG plus strict backend validation, and the customer/admin
> headers are cleaned up.
>
> **Critical preservation rule:** The project already contains a working
> concurrency-safe booking/reservation implementation. **Do not replace,
> duplicate, rewrite, or overwrite that logic.** All new
> activity-specific booking flows must call the existing
> booking/concurrency layer.

------------------------------------------------------------------------

## 0. Existing-System Preservation

-   [ ] Inspect the existing booking, reservation, locking and
    transaction implementation before modifying anything.
-   [ ] Reuse the existing concurrency logic exactly as the source of
    truth.
-   [ ] Do not introduce a second seat-locking/reservation system.
-   [ ] Do not add another Redis lock, database lock, queue-based lock,
    or competing race-condition mechanism unless the existing
    implementation explicitly requires an extension.
-   [ ] Preserve existing booking state transitions.
-   [ ] Preserve existing database constraints and transaction
    boundaries.
-   [ ] Preserve existing booking/payment/authentication APIs unless a
    deliberate, backward-compatible change is required.
-   [ ] Add activity-specific configuration **around** the existing
    booking engine, not inside it unless necessary.

### Required architecture

``` text
Activity Type
      ↓
Booking Model / Resource Model
      ↓
Activity-Specific Configuration
      ↓
EXISTING BOOKING SYSTEM
      ↓
EXISTING CONCURRENCY / RESERVATION LOGIC
      ↓
Database / Payment
```

------------------------------------------------------------------------

# 1. Current Admin UI Problem

The current admin page is a generic:

> **Admin Venue & Seat Grid Layout Builder**

and currently exposes the same fields for every activity:

-   Venue Name
-   Location
-   Venue Cover Photo
-   Total Rows
-   Seats Per Row
-   Premium Front Rows Count
-   Generate Venue & Seat Layout

This is appropriate for some cinema/theatre scenarios, but it is not a
correct abstraction for:

-   Concerts with standing/general-admission zones
-   Workshops with participant capacity
-   Games with timed slots
-   Sports team registration
-   Exhibitions
-   Conferences with sessions
-   Events with tables or mixed layouts

### Required change

Do **not** simply rename the existing seat builder.

Replace the one-size-fits-all configuration with:

``` text
Create Activity
      ↓
Select Activity Type
      ↓
Select Booking Model
      ↓
Select Venue
      ↓
Select Hall / Space
      ↓
Configure Activity-Specific Resources
      ↓
Configure Schedule
      ↓
Configure Pricing
      ↓
Configure Booking Rules
      ↓
Preview
      ↓
Publish
```

The admin UI must dynamically display only fields relevant to the
selected activity and booking model.

------------------------------------------------------------------------

# 2. Activity Type System

Create a first-class `ActivityType`.

Recommended values:

``` text
CINEMA
THEATRE
CONCERT
WORKSHOP
SPORTS
GAME
EXHIBITION
CONFERENCE
AMUSEMENT
OTHER
```

Create a separate `BookingModel` / `ResourceModel`.

Recommended values:

``` text
SEAT
GENERAL_ADMISSION
CAPACITY
SLOT
TABLE
TEAM
PASS
CUSTOM
```

Do not hard-code the assumption that every activity is represented by
rows and seats.

------------------------------------------------------------------------

# 3. Activity → Booking Model Defaults

  Activity     Recommended Default   Other Supported Models
  ------------ --------------------- ------------------------------
  Cinema       SEAT                  ---
  Theatre      SEAT                  TABLE / CUSTOM
  Concert      GENERAL_ADMISSION     SEAT
  Workshop     CAPACITY              SLOT / SEAT
  Sports       SEAT                  GENERAL_ADMISSION / TEAM
  Game         SLOT                  TEAM / CAPACITY
  Exhibition   GENERAL_ADMISSION     CAPACITY / SLOT
  Conference   SEAT                  CAPACITY / SESSION
  Amusement    SLOT                  CAPACITY / GENERAL_ADMISSION
  Other        Admin selected        CUSTOM

The defaults should guide the admin, not prevent valid configurations.

------------------------------------------------------------------------

# 4. New Admin UI --- Activity Selection

At the beginning of the creation flow, add:

### Activity Type

``` text
[ Select Activity Type ▼ ]

Cinema
Theatre
Concert
Workshop
Sports
Game
Exhibition
Conference
Amusement
Other
```

### Booking Model

After selecting the activity type:

``` text
[ Select Booking Model ▼ ]
```

Only show booking models valid for that activity.

Example:

``` text
WORKSHOP

Booking Model:
○ Capacity
○ Timed Slots
○ Assigned Seats
```

For a concert:

``` text
CONCERT

Booking Model:
○ General Admission
○ Assigned Seating
```

For a game:

``` text
GAME

Booking Model:
○ Timed Slots
○ Team
○ Capacity
```

------------------------------------------------------------------------

# 5. Venue / Hall / Space Architecture

Separate physical infrastructure from activities.

Recommended hierarchy:

``` text
Venue
 └── Hall / Space
      └── Resource Layout
           └── Activity
                └── Schedule
```

Example:

``` text
IG Stadium
 ├── Main Stand
 ├── VIP Stand
 ├── Ground
 └── Conference Hall
```

A hall/space must declare its supported resource configuration.

Examples:

``` text
Cinema Screen 1
→ SEAT

Concert Ground
→ GENERAL_ADMISSION

Workshop Room A
→ CAPACITY / TABLE / SEAT

Escape Room 2
→ SLOT

Football Ground
→ TEAM
```

Do not force every hall to have a seat grid.

------------------------------------------------------------------------

# 6. Activity-Specific Admin Configuration

## 6.1 Cinema

For:

``` text
CINEMA + SEAT
```

show:

### Basic Information

-   [ ] Movie/show name
-   [ ] Description
-   [ ] Poster
-   [ ] Trailer
-   [ ] Duration
-   [ ] Language
-   [ ] Genre
-   [ ] Age rating

### Venue

-   [ ] Venue
-   [ ] Screen/hall
-   [ ] Screen number
-   [ ] Screen format
-   [ ] Audio format

### Seat Layout

-   [ ] Sections
-   [ ] Rows
-   [ ] Row labels
-   [ ] Seats per row where applicable
-   [ ] Individual seat numbering
-   [ ] Aisles/gaps
-   [ ] Seat categories
-   [ ] Premium seats
-   [ ] VIP seats
-   [ ] Accessible seats
-   [ ] Blocked seats
-   [ ] Restricted-view seats

### Schedule

-   [ ] Date
-   [ ] Start time
-   [ ] End time
-   [ ] Multiple shows per day

### Pricing

-   [ ] Standard
-   [ ] Premium
-   [ ] VIP
-   [ ] Time/day-based pricing if supported

------------------------------------------------------------------------

# 7. Theatre

For:

``` text
THEATRE + SEAT
```

support irregular real-world layouts.

Admin controls:

-   [ ] Theatre/hall
-   [ ] Stage position
-   [ ] Sections
-   [ ] Balcony
-   [ ] Rows
-   [ ] Individual seats
-   [ ] Aisles
-   [ ] VIP
-   [ ] Premium
-   [ ] Accessible seats
-   [ ] Restricted-view seats
-   [ ] Show dates
-   [ ] Showtimes
-   [ ] Section-based pricing

### Important

Do not require:

``` text
Total Rows × Seats Per Row
```

as the only representation.

A theatre may have:

``` text
Front Section → 8 seats
Middle Section → 14 seats
Balcony → 20 seats
```

with gaps and different row lengths.

------------------------------------------------------------------------

# 8. Concert

Concerts must support both assigned seating and standing/general
admission.

## A. Assigned Seating

``` text
CONCERT
   ↓
SEAT
```

Configure:

-   [ ] Sections
-   [ ] VIP
-   [ ] Premium
-   [ ] Standard
-   [ ] Accessible area
-   [ ] Individual seats
-   [ ] Entry gates
-   [ ] Section pricing

## B. General Admission / Standing

``` text
CONCERT
   ↓
GENERAL_ADMISSION
```

Do **not** generate a seat grid.

Instead:

``` text
Zone
Capacity
Price
Entry Gate
Entry Rules
```

Example:

``` text
VIP Zone
Capacity: 500

General Zone
Capacity: 5,000
```

Optional:

-   [ ] Early entry
-   [ ] VIP/backstage pass
-   [ ] Age restriction
-   [ ] Wristband category
-   [ ] Gate assignment

------------------------------------------------------------------------

# 9. Workshop

For:

``` text
WORKSHOP
```

default to:

``` text
CAPACITY
```

Admin controls:

-   [ ] Workshop title
-   [ ] Instructor
-   [ ] Description
-   [ ] Venue
-   [ ] Hall/room
-   [ ] Session date
-   [ ] Start/end time
-   [ ] Maximum participants
-   [ ] Minimum participants
-   [ ] Registration cutoff
-   [ ] Price
-   [ ] Materials included
-   [ ] Age/skill requirements

Optional:

``` text
No assigned seating
Free seating
Assigned seating
Table-based seating
Timed slots
```

The seat builder must only appear if the admin explicitly selects an
assigned-seat/table model.

------------------------------------------------------------------------

# 10. Sports

Sports should support multiple booking models.

## Spectator Seating

``` text
SPORTS + SEAT
```

Configure:

-   [ ] Stadium
-   [ ] Stand
-   [ ] Block
-   [ ] Row
-   [ ] Seat
-   [ ] VIP
-   [ ] Premium
-   [ ] Accessible seating
-   [ ] Pricing by stand/block

## General Admission

``` text
SPORTS + GENERAL_ADMISSION
```

Configure:

-   [ ] Zone
-   [ ] Capacity
-   [ ] Price
-   [ ] Entry gate

## Team Registration

``` text
SPORTS + TEAM
```

Configure:

-   [ ] Maximum teams
-   [ ] Minimum team size
-   [ ] Maximum team size
-   [ ] Registration fee
-   [ ] Player registration fields
-   [ ] Tournament schedule
-   [ ] Team eligibility rules

------------------------------------------------------------------------

# 11. Games

For:

-   Escape rooms
-   Bowling
-   Gaming arenas
-   VR experiences
-   Arcade competitions
-   Multiplayer games

prefer:

``` text
GAME + SLOT
```

Admin controls:

-   [ ] Game/activity
-   [ ] Room
-   [ ] Slot duration
-   [ ] Break duration
-   [ ] Start time
-   [ ] End time
-   [ ] Maximum players
-   [ ] Minimum players
-   [ ] Price per person
-   [ ] Price per group
-   [ ] Team size
-   [ ] Number of simultaneous rooms

Example:

``` text
Escape Room A

10:00–11:00
Capacity: 6

11:30–12:30
Capacity: 6
```

The admin should configure slots rather than rows/seats.

------------------------------------------------------------------------

# 12. Exhibition

Prefer:

``` text
EXHIBITION + GENERAL_ADMISSION
```

or:

``` text
EXHIBITION + CAPACITY
```

Admin controls:

-   [ ] Exhibition name
-   [ ] Venue
-   [ ] Hall
-   [ ] Daily capacity
-   [ ] Entry slots
-   [ ] Adult ticket
-   [ ] Child ticket
-   [ ] Student ticket
-   [ ] VIP pass
-   [ ] Entry gate
-   [ ] Registration cutoff

------------------------------------------------------------------------

# 13. Conference

Support:

``` text
CONFERENCE + SEAT
CONFERENCE + CAPACITY
CONFERENCE + SESSION
```

Admin controls:

-   [ ] Conference
-   [ ] Venue
-   [ ] Hall
-   [ ] Auditorium layout if assigned seating
-   [ ] Session list
-   [ ] Session capacity
-   [ ] Pass types
-   [ ] Session registration
-   [ ] Speaker information
-   [ ] Schedule

------------------------------------------------------------------------

# 14. Amusement / Attractions

For amusement activities:

``` text
AMUSEMENT + SLOT
AMUSEMENT + CAPACITY
AMUSEMENT + GENERAL_ADMISSION
```

Configure:

-   [ ] Attraction
-   [ ] Operating hours
-   [ ] Slot duration
-   [ ] Capacity per slot
-   [ ] Age restrictions
-   [ ] Height/eligibility rules where relevant
-   [ ] Price
-   [ ] Entry gate

------------------------------------------------------------------------

# 15. Generic / Other Activity

For:

``` text
OTHER
```

the admin can choose:

``` text
SEAT
GENERAL_ADMISSION
CAPACITY
SLOT
TABLE
TEAM
PASS
CUSTOM
```

The UI should then render the corresponding configuration form.

------------------------------------------------------------------------

# 16. Configuration-Driven Admin UI

Avoid a large collection of unrelated hardcoded forms.

Use a configuration/schema layer.

Conceptual example:

``` json
{
  "activityType": "WORKSHOP",
  "bookingModel": "CAPACITY",
  "fields": [
    "venue",
    "hall",
    "session",
    "capacity",
    "price",
    "registrationCutoff"
  ]
}
```

Cinema:

``` json
{
  "activityType": "CINEMA",
  "bookingModel": "SEAT",
  "fields": [
    "venue",
    "hall",
    "seatLayout",
    "showtime",
    "seatCategories",
    "pricing"
  ]
}
```

Concert:

``` json
{
  "activityType": "CONCERT",
  "bookingModel": "GENERAL_ADMISSION",
  "fields": [
    "venue",
    "zone",
    "capacity",
    "entryGate",
    "pricing"
  ]
}
```

The frontend should render fields based on validated configuration
metadata.

------------------------------------------------------------------------

# 17. Resource/Layout Builder Modes

Convert the current generic **Seat Grid Layout Builder** into a **Venue
Resource & Layout Builder** with multiple modes:

``` text
SEAT_LAYOUT
ZONE_CAPACITY
GENERAL_ADMISSION
TABLE_LAYOUT
SLOT_LAYOUT
TEAM_CONFIGURATION
PASS_CONFIGURATION
CUSTOM
```

### Seat Layout

Use for:

-   Cinema
-   Theatre
-   Seated concert
-   Stadium seating
-   Conference seating

### Zone Capacity

Use for:

-   Concert zones
-   Stadium general admission
-   Exhibition zones

### Slot Layout

Use for:

-   Games
-   Workshops
-   Attractions

### Team Configuration

Use for:

-   Sports tournaments
-   Team games

------------------------------------------------------------------------

# 18. Seat Builder Improvements

When the selected model is `SEAT`, support:

-   [ ] Irregular row lengths
-   [ ] Sections
-   [ ] Aisles
-   [ ] Gaps
-   [ ] Balconies
-   [ ] Individual seat editing
-   [ ] Seat categories
-   [ ] VIP seats
-   [ ] Premium seats
-   [ ] Accessible seats
-   [ ] Blocked seats
-   [ ] Restricted-view seats
-   [ ] Per-seat pricing override
-   [ ] Visual preview
-   [ ] Seat numbering
-   [ ] Row labels
-   [ ] Layout validation

The old:

``` text
Total Rows
Seats Per Row
Premium Front Rows Count
```

may remain as a quick-generation option **only inside the SEAT layout
mode**.

It must not be the universal venue configuration.

------------------------------------------------------------------------

# 19. Validation Rules for Admin Configuration

Before saving/publishing:

-   [ ] Activity type must be valid.
-   [ ] Booking model must be valid for the activity.
-   [ ] Venue must exist.
-   [ ] Hall/space must belong to the selected venue.
-   [ ] Hall must support the selected resource model.
-   [ ] Capacity must be positive.
-   [ ] Slot duration must be valid.
-   [ ] Start/end times must be valid.
-   [ ] Seat identifiers must be unique within the layout.
-   [ ] Zone identifiers must be unique.
-   [ ] Team limits must be logically consistent.
-   [ ] Prices must be validated server-side.
-   [ ] Required activity-specific fields must be present.
-   [ ] Published activities must not have an incomplete resource
    configuration.

------------------------------------------------------------------------

# 20. TicketBot --- RAG + Strict System Validation

TicketBot should be changed from a generic chatbot into a
**system-grounded ticket assistant**.

Important:

> RAG should provide trusted context, but RAG alone must not be treated
> as an input validator or authorization mechanism.

Required architecture:

``` text
User Message
      ↓
Intent / Entity Extraction
      ↓
Schema Validation
      ↓
RAG Retrieval from Trusted Knowledge
      ↓
Backend / Live Data Validation
      ↓
Authorization
      ↓
Allowed Action
      ↓
Existing Booking System
```

------------------------------------------------------------------------

# 21. TicketBot Knowledge Base

RAG should index only approved application knowledge.

Include:

-   [ ] Activity types
-   [ ] Supported booking models
-   [ ] Activities
-   [ ] Venues
-   [ ] Halls/spaces
-   [ ] Booking rules
-   [ ] Cancellation policy
-   [ ] Refund policy
-   [ ] FAQs
-   [ ] Activity descriptions
-   [ ] Help documentation
-   [ ] Admin configuration documentation

Do not treat arbitrary web pages or user-provided instructions as
authoritative system policy.

------------------------------------------------------------------------

# 22. Static RAG vs Live Booking Data

Keep two distinct sources.

## RAG / Knowledge Base

Used for:

``` text
What activities are supported?
What is the cancellation policy?
What does this activity mean?
What booking model does a workshop use?
How does booking work?
```

## Live Backend

Used for:

``` text
Current availability
Current seat status
Current capacity
Current slots
Current price
Current schedule
Booking status
User bookings
```

The chatbot must never use stale vector-store data to claim that a
seat/slot is currently available.

Example:

``` text
User:
"Are A12 and A13 available tonight?"

RAG:
Understand terminology and venue/activity context.

Backend:
Fetch current availability.

Bot:
Respond only from current backend data.
```

------------------------------------------------------------------------

# 23. Valid Input Enforcement

Define structured chatbot intents.

Example:

``` json
{
  "intent": "SEARCH_ACTIVITY",
  "activityType": "CINEMA",
  "location": "Mohali",
  "date": "2026-08-24"
}
```

Before any action:

``` text
Schema validation
      ↓
Database/entity validation
      ↓
Authorization
      ↓
Action
```

Invalid entities must be rejected.

Example:

``` text
User:
"Book Hall 999."

System:
Hall 999 is not a valid hall.
Do not create, infer, or hallucinate it.
```

The model must not invent:

-   Activities
-   Venues
-   Halls
-   Seats
-   Zones
-   Slots
-   Prices
-   Booking IDs
-   Coupons
-   Users

------------------------------------------------------------------------

# 24. Allowed TicketBot Tools

Expose explicit backend functions only.

Recommended:

``` text
searchActivities()
getActivityDetails()
getVenueDetails()
getHallDetails()
getSchedules()
getAvailability()
getPricing()
getUserBookings()
getBookingStatus()
createBooking()
cancelBooking()
getCancellationPolicy()
```

Do not provide:

``` text
raw SQL execution
arbitrary API execution
filesystem access
admin-only operations
```

unless separately authorized and explicitly exposed.

------------------------------------------------------------------------

# 25. TicketBot Authorization

TicketBot must use the same authentication and RBAC model as the normal
application.

``` text
CUSTOMER
 ├── Search
 ├── View public activity information
 ├── View own bookings
 └── Perform allowed customer booking actions

ADMIN
 ├── Authorized admin operations
 └── Admin data only where explicitly permitted

SUPER_ADMIN
 └── Authorized system administration
```

Never allow:

``` text
Customer → TicketBot → Admin API
```

just because the user asks for it.

------------------------------------------------------------------------

# 26. TicketBot Booking Flow

For any booking action:

``` text
User Request
      ↓
Extract Intent
      ↓
Validate Activity
      ↓
Validate Schedule
      ↓
Validate Resource
      ↓
Validate User Permission
      ↓
Fetch Server-Side Price
      ↓
Confirmation
      ↓
EXISTING BOOKING SYSTEM
      ↓
EXISTING CONCURRENCY LOGIC
      ↓
Backend Confirmation
      ↓
Bot Response
```

The chatbot must never claim:

``` text
"Booking successful"
```

until the backend actually returns a successful booking result.

------------------------------------------------------------------------

# 27. RAG Security

Implement:

-   [ ] Trusted document allowlist
-   [ ] Document metadata
-   [ ] Document versioning
-   [ ] Freshness metadata
-   [ ] Retrieval limits
-   [ ] Access filtering
-   [ ] No secrets in vector storage
-   [ ] No credentials in indexed documents
-   [ ] Prompt-injection-resistant retrieval handling
-   [ ] Source attribution internally for traceability

Treat retrieved content as **untrusted context/data**, not executable
instructions.

------------------------------------------------------------------------

# 28. RAG Failure Handling

If the system cannot retrieve valid information:

``` text
Do not guess.
```

Instead:

``` text
"I couldn't find a valid activity matching that request."
```

If the user supplies an unsupported activity:

``` text
"I can currently help with cinema, theatre, concerts, workshops, sports, games, exhibitions, conferences and supported custom activities."
```

The list should be generated from the application's actual configured
activity types rather than hardcoded in the model prompt where possible.

------------------------------------------------------------------------

# 29. Header --- Current UI Issues

The supplied screenshot shows the customer header currently contains a
technical ticker with text such as:

``` text
HIGH-DEMAND CONCERTS & MOVIES
ZERO RACE CONDITIONS
10-MINUTE ATOMIC REDIS HOLD LOCKS
HMAC-SIGNED QR E-TICKETS
GOURMET POPCORN & BEVERAGE COMBOS
```

The technical/project implementation claims should **not** be exposed in
the customer-facing header.

Remove references to:

-   Redis
-   Race conditions
-   Atomic locks
-   HMAC signing
-   Internal security implementation
-   Internal architecture

These belong in technical documentation, not the promotional customer
UI.

------------------------------------------------------------------------

# 30. Customer Header Redesign

The current header has:

``` text
Ticker
Brand
Search
Offers
Wishlist
My Bookings
Theme
Profile
Logout
Category Navigation
```

Keep the useful customer controls but simplify the presentation.

Recommended structure:

``` text
┌─────────────────────────────────────────────────────────────┐
│ Logo     Search events...     Offers  Wishlist  Bookings  User │
├─────────────────────────────────────────────────────────────┤
│ Movies   Concerts   Events   Plays   Sports   Comedy   Workshops │
└─────────────────────────────────────────────────────────────┘
```

### Required

-   [ ] Remove technical project claims from ticker.
-   [ ] Prefer removing the ticker entirely if it has no customer value.
-   [ ] If retained, use customer-facing promotional content only.
-   [ ] Keep the brand/logo aligned.
-   [ ] Keep search responsive.
-   [ ] Keep Offers/Wishlist/My Bookings accessible.
-   [ ] Keep account/profile controls grouped.
-   [ ] Maintain consistent spacing.
-   [ ] Fix vertical alignment.
-   [ ] Ensure header does not overlap content.
-   [ ] Ensure mobile responsiveness.
-   [ ] Ensure keyboard accessibility.
-   [ ] Ensure visible focus states.
-   [ ] Ensure active navigation state is clear.

Example replacement ticker:

``` text
🎬 New Releases  •  🎤 Live Concerts  •  🎭 Theatre Shows  •  🎟️ Exclusive Offers
```

Only display claims that are actually supported by the application.

------------------------------------------------------------------------

# 31. Admin Header Redesign

The admin page shown in the supplied screenshot currently begins with:

``` text
Admin Venue & Seat Grid Layout Builder
Manage venue capacity, seat row counts, seat category tiers, and venue cover photos
```

Change this to a broader resource-management concept.

Recommended:

``` text
Admin Activity & Venue Configuration
Configure venues, halls, resources, layouts, schedules and booking models
```

The subtitle should change dynamically based on the selected mode.

Examples:

``` text
Seat Layout
Configure sections, rows, seats and categories

Zone Capacity
Configure zones, capacity and pricing

Timed Slots
Configure rooms, slots and participant limits

Team Registration
Configure team limits and registration rules
```

This makes the admin interface accurately describe what it is doing.

------------------------------------------------------------------------

# 32. Admin Form UX

Do not show every possible field at once.

Use progressive disclosure:

``` text
1. Activity Type
2. Booking Model
3. Venue
4. Hall / Space
5. Resource Configuration
6. Schedule
7. Pricing
8. Booking Rules
9. Preview
```

Add:

-   [ ] Clear field descriptions
-   [ ] Contextual help
-   [ ] Validation messages
-   [ ] Preview before publishing
-   [ ] Save draft
-   [ ] Publish/unpublish
-   [ ] Edit existing configuration
-   [ ] Confirmation before destructive changes

------------------------------------------------------------------------

# 33. Trailer --- In-Page Video

If the platform already has a trailer button that redirects to another
page/link:

Change it to:

``` text
Watch Trailer
      ↓
Modal
      ↓
Responsive iframe
      ↓
Close
      ↓
Stop playback / remove iframe
```

Requirements:

-   [ ] Open trailer in the same page.
-   [ ] Use an accessible modal.
-   [ ] Use responsive iframe dimensions.
-   [ ] Stop playback when modal closes.
-   [ ] Allow ESC to close.
-   [ ] Provide visible close button.
-   [ ] Trap focus appropriately.
-   [ ] Prevent arbitrary iframe URLs.
-   [ ] Allow only trusted video providers.
-   [ ] Validate/normalize the video URL before embedding.
-   [ ] Configure CSP/frame restrictions appropriately.

Do not allow arbitrary user-supplied iframe sources.

------------------------------------------------------------------------

# 34. Security Controls

Verify and document the actual implementation of:

-   [ ] Authentication
-   [ ] Secure session management
-   [ ] RBAC
-   [ ] Input validation
-   [ ] Server-side authorization
-   [ ] IDOR protection
-   [ ] Rate limiting
-   [ ] Secure cookies
-   [ ] CORS
-   [ ] CSRF protection where applicable
-   [ ] CSP
-   [ ] XSS protection
-   [ ] SQL injection protection
-   [ ] Audit logging
-   [ ] Secret management
-   [ ] Payment webhook verification
-   [ ] QR ticket validation
-   [ ] Replay protection where applicable

Do not claim a control is implemented until verified in the actual code.

------------------------------------------------------------------------

# 35. Repository / GitHub Cleanup

Before changing repository contents:

-   [ ] Inspect the complete repository tree.
-   [ ] Identify source files actually imported by the application.
-   [ ] Inspect dependency manifests.
-   [ ] Inspect build/deployment configuration.
-   [ ] Inspect GitHub Actions.
-   [ ] Inspect `.gitignore`.
-   [ ] Search for credentials/secrets.
-   [ ] Search for generated files.
-   [ ] Search for debug/test artifacts.
-   [ ] Search for unused experimental implementations.

### Potentially unsafe/unnecessary files to remove if confirmed unused

``` text
.env
.env.local
.env.production
*.pem
*.key
credentials.json
service-account.json
database dumps
*.sqlite
*.db
node_modules/
dist/
build/
coverage/
__pycache__/
*.pyc
.venv/
venv/
.idea/
.DS_Store
Thumbs.db
*.log
```

Do not delete required deployment/configuration files merely because
their names look suspicious.

------------------------------------------------------------------------

# 36. Secret Rotation

If any real secret has ever been committed:

1.  [ ] Revoke/rotate the credential.
2.  [ ] Remove it from the current working tree.
3.  [ ] Move configuration to environment variables/secrets management.
4.  [ ] Add a safe `.env.example`.
5.  [ ] Check Git history for continued exposure.
6.  [ ] Perform history cleanup if necessary.
7.  [ ] Verify the rotated secret is not present elsewhere.

Deleting a secret from the latest commit does not necessarily remove it
from Git history.

------------------------------------------------------------------------

# 37. `.gitignore`

Ensure the repository ignores environment secrets and generated
artifacts.

Example:

``` text
# Environment
.env
.env.*
!.env.example

# Dependencies
node_modules/
.venv/
venv/

# Builds
dist/
build/
.next/
coverage/

# Python
__pycache__/
*.pyc

# IDE
.idea/
.vscode/

# OS
.DS_Store
Thumbs.db

# Logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
```

Adjust to the actual technology stack.

------------------------------------------------------------------------

# 38. `.env.example`

Create/update:

``` text
.env.example
```

with variable names only.

Example:

``` text
DATABASE_URL=
JWT_SECRET=
PAYMENT_SECRET_KEY=
PAYMENT_WEBHOOK_SECRET=
OPENAI_API_KEY=
EMAIL_HOST=
EMAIL_USERNAME=
EMAIL_PASSWORD=
```

Never commit actual values.

------------------------------------------------------------------------

# 39. README Documentation

Update the root `README.md` to describe the actual system.

Recommended structure:

``` text
# Ticket Booking Platform

## Overview
## Features
## Supported Activity Types
## Booking Models
## Venue / Hall Architecture
## Admin Configuration
## Booking Flow
## Existing Concurrency System
## Authentication & Sessions
## Security
## TicketBot / RAG
## Trailer Embedding
## Project Structure
## Environment Variables
## Local Development
## Database Setup
## Testing
## Deployment
## Repository Hygiene
## Future Improvements
```

Do not document technical claims that are not implemented.

------------------------------------------------------------------------

# 40. README --- Activity Types

Document the actual activity-to-booking model mapping.

Example:

``` text
Cinema       → Seat
Theatre      → Seat
Concert      → Seat / General Admission
Workshop     → Capacity / Slot / Seat
Sports       → Seat / General Admission / Team
Game         → Slot / Team / Capacity
Exhibition   → General Admission / Capacity / Slot
Conference   → Seat / Capacity / Session
Amusement    → Slot / Capacity / General Admission
Other        → Admin-selected
```

------------------------------------------------------------------------

# 41. README --- TicketBot

Document:

``` text
User
 ↓
Intent + Entity Extraction
 ↓
Schema Validation
 ↓
RAG Retrieval
 ↓
Trusted Knowledge
 ↓
Live Backend Validation
 ↓
Authorization
 ↓
Allowed Tool
 ↓
Existing Booking System
```

Explicitly document that:

-   RAG is not the authorization layer.
-   RAG is not the live availability source.
-   The backend validates entities.
-   The chatbot cannot execute arbitrary SQL.
-   The chatbot cannot invent activities/halls/seats.
-   The chatbot follows normal user permissions.
-   Booking actions reuse the existing booking/concurrency system.

------------------------------------------------------------------------

# 42. Testing

## Admin Configuration

-   [ ] Cinema → seat layout appears.
-   [ ] Theatre → irregular seat layout appears.
-   [ ] Concert → seat/general-admission choice appears.
-   [ ] Workshop → capacity/slot configuration appears.
-   [ ] Sports → spectator/team configuration appears.
-   [ ] Game → slot/team configuration appears.
-   [ ] Exhibition → capacity/general-admission configuration appears.
-   [ ] Conference → seat/capacity/session configuration appears.
-   [ ] Unsupported field combinations are blocked.
-   [ ] Invalid capacity/price/time values are rejected.

## TicketBot

-   [ ] Valid activity input works.
-   [ ] Invalid activity is rejected.
-   [ ] Invalid venue is rejected.
-   [ ] Invalid hall is rejected.
-   [ ] Invalid seat is rejected.
-   [ ] Invalid slot is rejected.
-   [ ] Stale RAG availability is never presented as live.
-   [ ] Unauthorized booking is rejected.
-   [ ] Customer cannot access admin operations.
-   [ ] Prompt injection inside retrieved content does not become an
    executable instruction.
-   [ ] Booking success is reported only after backend confirmation.

## UI

-   [ ] Technical ticker removed.
-   [ ] Header alignment fixed.
-   [ ] Header works on mobile.
-   [ ] Navigation remains usable.
-   [ ] Admin heading accurately describes the current configuration
    mode.
-   [ ] Trailer opens in modal.
-   [ ] Trailer playback stops when modal closes.

## Regression

-   [ ] Existing booking tests pass.
-   [ ] Existing concurrency tests pass.
-   [ ] Existing reservation logic is unchanged.
-   [ ] Existing payment flow passes.
-   [ ] Existing authentication/session flow passes.
-   [ ] Existing QR ticket flow passes.

------------------------------------------------------------------------

# 43. Definition of Done

-   [ ] The generic seat builder is no longer used for every event type.
-   [ ] Admin selects Activity Type.
-   [ ] Admin selects Booking Model.
-   [ ] Venue/Hall/Space determines available resource models.
-   [ ] Cinema supports proper seat configuration.
-   [ ] Theatre supports irregular seating.
-   [ ] Concert supports seated and general-admission modes.
-   [ ] Workshops support capacity/slot configuration.
-   [ ] Sports support spectator and team registration.
-   [ ] Games support timed slots/team configuration.
-   [ ] Exhibitions support general admission/capacity.
-   [ ] Conferences support seating/capacity/session models.
-   [ ] Existing concurrency/booking logic is preserved and reused.
-   [ ] No duplicate locking/concurrency system is introduced.
-   [ ] TicketBot uses RAG for trusted contextual grounding.
-   [ ] TicketBot uses structured validation and live backend
    validation.
-   [ ] TicketBot cannot invent system entities.
-   [ ] TicketBot respects authentication and authorization.
-   [ ] Trailer opens in an in-page modal iframe.
-   [ ] Only trusted trailer providers can be embedded.
-   [ ] Customer technical ticker is removed or replaced with
    customer-facing content.
-   [ ] Customer header is visually aligned and responsive.
-   [ ] Admin header reflects the actual selected resource
    configuration.
-   [ ] Unsafe/unnecessary repository files are removed only after
    dependency/reference inspection.
-   [ ] Secrets are not committed.
-   [ ] `.gitignore` and `.env.example` are correct.
-   [ ] README documentation matches the real implementation.
-   [ ] Security documentation contains only verified controls.
-   [ ] Full regression suite passes.

------------------------------------------------------------------------

# 44. Recommended Implementation Order

To reduce regressions, implement in this order:

``` text
1. Audit current booking/concurrency system
        ↓
2. Audit current venue/seat data model
        ↓
3. Introduce ActivityType + BookingModel
        ↓
4. Introduce Venue → Hall/Space model if required
        ↓
5. Build configuration-driven admin UI
        ↓
6. Implement activity-specific resource editors
        ↓
7. Connect resource configuration to EXISTING booking system
        ↓
8. Add validation
        ↓
9. Implement RAG knowledge layer
        ↓
10. Add structured TicketBot intents/tools
        ↓
11. Add backend authorization + validation
        ↓
12. Convert trailer to secure modal iframe
        ↓
13. Clean customer/admin headers
        ↓
14. Audit repository and secrets
        ↓
15. Update README/docs
        ↓
16. Run regression/security tests
```

## Final rule

**Do not redesign working booking/concurrency logic merely to
accommodate activity types.**

Activity types should define **what resource is being configured and
booked**; the existing booking system should remain the authoritative
mechanism for safely creating and managing bookings.
