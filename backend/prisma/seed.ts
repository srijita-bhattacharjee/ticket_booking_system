import { PrismaClient, Role, EventType, EventStatus, SeatCategory, SeatStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Clean existing data
  await prisma.bookingAddon.deleteMany();
  await prisma.foodCoupon.deleteMany();
  await prisma.partnershipProof.deleteMany();
  await prisma.menuItem.deleteMany();
  await prisma.foodStall.deleteMany();
  await prisma.ticket.deleteMany();
  await prisma.bookingSeat.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.holdSeat.deleteMany();
  await prisma.hold.deleteMany();
  await prisma.waitlistOffer.deleteMany();
  await prisma.waitlistEntry.deleteMany();
  await prisma.eventSeat.deleteMany();
  await prisma.event.deleteMany();
  await prisma.venueSeat.deleteMany();
  await prisma.venue.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash('Password123!', 10);

  // 1. Create Users
  const admin = await prisma.user.create({
    data: {
      name: 'System Admin',
      email: 'admin@ticketbooking.com',
      passwordHash,
      role: Role.ADMIN,
    },
  });

  const organiser = await prisma.user.create({
    data: {
      name: 'Apex Events Organiser',
      email: 'organiser@apexevents.com',
      passwordHash,
      role: Role.ORGANISER,
    },
  });

  const customer1 = await prisma.user.create({
    data: {
      name: 'John Doe',
      email: 'john@example.com',
      passwordHash,
      role: Role.CUSTOMER,
    },
  });

  const customer2 = await prisma.user.create({
    data: {
      name: 'Alice Smith',
      email: 'alice@example.com',
      passwordHash,
      role: Role.CUSTOMER,
    },
  });

  console.log('✅ Users created');

  // 2. Create Venues
  const venue1 = await prisma.venue.create({
    data: {
      name: 'Grand Cinema Hall 1',
      location: 'Downtown Plaza, Screen 4',
      imageUrl: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1200&q=80',
      createdById: admin.id,
    },
  });

  const venue2 = await prisma.venue.create({
    data: {
      name: 'Metropolitan Arena',
      location: 'Main Olympic Stadium Complex',
      imageUrl: 'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?auto=format&fit=crop&w=1200&q=80',
      createdById: admin.id,
    },
  });

  console.log('✅ Venues created');

  // 3. Create Seats for Venue 1 (6 Rows A-F, 8 Seats each = 48 seats)
  const rows1 = ['A', 'B', 'C', 'D', 'E', 'F'];
  const venue1Seats = [];
  for (const r of rows1) {
    const category = ['A', 'B'].includes(r) ? SeatCategory.PREMIUM : SeatCategory.STANDARD;
    for (let s = 1; s <= 8; s++) {
      const seat = await prisma.venueSeat.create({
        data: {
          venueId: venue1.id,
          rowNumber: r,
          seatNumber: s,
          category,
        },
      });
      venue1Seats.push(seat);
    }
  }

  // Create Seats for Venue 2 (8 Rows A-H, 10 Seats each = 80 seats)
  const rows2 = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
  const venue2Seats = [];
  for (const r of rows2) {
    const category = ['A', 'B', 'C'].includes(r) ? SeatCategory.PREMIUM : SeatCategory.STANDARD;
    for (let s = 1; s <= 10; s++) {
      const seat = await prisma.venueSeat.create({
        data: {
          venueId: venue2.id,
          rowNumber: r,
          seatNumber: s,
          category,
        },
      });
      venue2Seats.push(seat);
    }
  }

  console.log('✅ Venue seats created');

  // 4. Create Events
  const event1 = await prisma.event.create({
    data: {
      organiserId: organiser.id,
      venueId: venue1.id,
      title: 'Inception 4K IMAX Special Screening',
      description: 'Experience Christopher Nolan’s masterpiece in mind-bending 4K IMAX audio and visual clarity.',
      eventType: EventType.MOVIE,
      eventDate: new Date(Date.now() + 86400000 * 3), // 3 days from now
      startTime: '19:30',
      imageUrl: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=1200&q=80',
      status: EventStatus.ON_SALE,
    },
  });

  const event2 = await prisma.event.create({
    data: {
      organiserId: organiser.id,
      venueId: venue2.id,
      title: 'Coldplay — Music of the Spheres World Tour',
      description: 'Live in concert featuring hit anthems Yellow, Viva La Vida, Fix You, and breathtaking light displays.',
      eventType: EventType.CONCERT,
      eventDate: new Date(Date.now() + 86400000 * 7), // 7 days from now
      startTime: '20:00',
      imageUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1200&q=80',
      status: EventStatus.ON_SALE,
    },
  });

  console.log('✅ Events created');

  // 5. Populate Event Seats with Tiered Pricing
  for (const vs of venue1Seats) {
    await prisma.eventSeat.create({
      data: {
        eventId: event1.id,
        venueSeatId: vs.id,
        category: vs.category,
        price: vs.category === SeatCategory.PREMIUM ? 25.00 : 15.00,
        status: SeatStatus.AVAILABLE,
      },
    });
  }

  for (const vs of venue2Seats) {
    await prisma.eventSeat.create({
      data: {
        eventId: event2.id,
        venueSeatId: vs.id,
        category: vs.category,
        price: vs.category === SeatCategory.PREMIUM ? 150.00 : 85.00,
        status: SeatStatus.AVAILABLE,
      },
    });
  }

  console.log('✅ Event seats mapped with pricing');

  // 6. Create Food Stalls & Menus (Admin)
  const stall1 = await prisma.foodStall.create({
    data: {
      venueId: venue1.id,
      name: 'Cinema Gourmet Snacks & Soda Hub',
      description: 'Freshly buttered popcorn, artisan nachos, and iced beverages.',
      location: 'Grand Cinema Hall 1 — Main Lobby Counter',
      imageUrl: 'https://images.unsplash.com/photo-1585647347483-22b66260dfff?auto=format&fit=crop&w=800&q=80',
    },
  });

  const stall2 = await prisma.foodStall.create({
    data: {
      venueId: venue2.id,
      name: 'Metropolitan VIP Arena Lounge',
      description: 'Premium gourmet sliders, craft sodas, and stadium snacks.',
      location: 'Metropolitan Arena — VIP Gate 2',
      imageUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80',
    },
  });

  // Create Menu Items / Combos
  const item1 = await prisma.menuItem.create({
    data: {
      stallId: stall1.id,
      name: 'Jumbo Butter Popcorn + Large Soda Combo',
      description: 'Crispy warm butter popcorn with 32oz refreshing beverage.',
      category: 'Combo',
      price: 14.99,
      imageUrl: 'https://images.unsplash.com/photo-1578849278619-e73505e9610f?auto=format&fit=crop&w=800&q=80',
    },
  });

  const item2 = await prisma.menuItem.create({
    data: {
      stallId: stall1.id,
      name: 'Loaded Loaded Cheese Nachos',
      description: 'Tortilla chips drenched in warm jalapeno cheese and salsa.',
      category: 'Snack',
      price: 9.50,
      imageUrl: 'https://images.unsplash.com/photo-1513456852971-30c0b8199d4d?auto=format&fit=crop&w=800&q=80',
    },
  });

  const item3 = await prisma.menuItem.create({
    data: {
      stallId: stall2.id,
      name: 'Stadium Gourmet Cheeseburger + Craft Beer/Soda',
      description: 'Angus beef burger with cheddar, caramelized onions and beverage.',
      category: 'Combo',
      price: 18.99,
      imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80',
    },
  });

  console.log('✅ Food stalls & menu combos created');

  // 7. Create Partnership Proof (Organiser)
  const partnership1 = await prisma.partnershipProof.create({
    data: {
      organiserId: organiser.id,
      foodStallId: stall1.id,
      partnerName: 'Cinema Gourmet Snacks LLC',
      documentUrl: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=800&q=80',
      agreementRef: 'AGREE-CINEMA-2026-08',
      status: 'APPROVED',
      notes: 'Verified partner agreement for movie screenings discount vouchers.',
    },
  });

  // 8. Create Food Coupons
  await prisma.foodCoupon.create({
    data: {
      partnershipId: partnership1.id,
      foodStallId: stall1.id,
      eventId: event1.id,
      code: 'POPCORN15',
      title: '15% Off Popcorn & Soda Combos',
      description: 'Get 15% discount on any jumbo combo during Inception screening.',
      discountPercent: 15,
      minSpend: 10,
      imageUrl: 'https://images.unsplash.com/photo-1578849278619-e73505e9610f?auto=format&fit=crop&w=800&q=80',
    },
  });

  await prisma.foodCoupon.create({
    data: {
      partnershipId: partnership1.id,
      foodStallId: stall1.id,
      code: 'FEAST5',
      title: '$5 Off Gourmet Snack Orders',
      description: 'Save $5 on orders over $15 at Cinema Gourmet Snacks.',
      discountAmount: 5.0,
      minSpend: 15,
      imageUrl: 'https://images.unsplash.com/photo-1513456852971-30c0b8199d4d?auto=format&fit=crop&w=800&q=80',
    },
  });

  console.log('✅ Partnership proof & food coupons created');
  console.log('🎉 Database seeding complete!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
