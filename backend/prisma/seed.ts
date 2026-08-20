import { PrismaClient, Role, EventType, EventStatus, SeatCategory, SeatStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Clean existing data
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
      createdById: admin.id,
    },
  });

  const venue2 = await prisma.venue.create({
    data: {
      name: 'Metropolitan Arena',
      location: 'Main Olympic Stadium Complex',
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
