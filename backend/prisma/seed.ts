import { PrismaClient, Role, EventType, EventStatus, SeatCategory, SeatStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed with multi-category events...');

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
      name: 'Metropolitan Arena & Stadium',
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

  // 4. Create Events Across All Categories
  const eventsData = [
    // 🎬 MOVIES
    {
      title: 'Avengers: Endgame — Special Re-Screening',
      description: 'The epic finale of the Infinity Saga on the big screen with Dolby Atmos surround sound.',
      eventType: EventType.MOVIE,
      eventDate: new Date(Date.now() + 86400000 * 2),
      startTime: '18:00',
      venueId: venue1.id,
      imageUrl: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=1200&q=80',
      premPrice: 25.0,
      stdPrice: 15.0,
    },
    {
      title: 'Dune: Part Two (IMAX 3D Experience)',
      description: 'Follow Paul Atreides’ mythic journey on Arrakis in stunning IMAX 3D resolution.',
      eventType: EventType.MOVIE,
      eventDate: new Date(Date.now() + 86400000 * 4),
      startTime: '20:30',
      venueId: venue1.id,
      imageUrl: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1200&q=80',
      premPrice: 28.0,
      stdPrice: 18.0,
    },

    // 🎤 CONCERTS
    {
      title: 'Coldplay — Music of the Spheres World Tour',
      description: 'Live in concert featuring hit anthems Yellow, Viva La Vida, Fix You, and breathtaking light displays.',
      eventType: EventType.CONCERT,
      eventDate: new Date(Date.now() + 86400000 * 7),
      startTime: '20:00',
      venueId: venue2.id,
      imageUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1200&q=80',
      premPrice: 150.0,
      stdPrice: 85.0,
    },
    {
      title: 'Diljit Dosanjh Live — Dil-Luminati Tour',
      description: 'Electrifying Punjabi pop experience live on stage with full live band performance.',
      eventType: EventType.CONCERT,
      eventDate: new Date(Date.now() + 86400000 * 10),
      startTime: '19:00',
      venueId: venue2.id,
      imageUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1200&q=80',
      premPrice: 180.0,
      stdPrice: 95.0,
    },

    // 🎭 PLAYS / THEATRE
    {
      title: 'Hamlet — Globe Theatre Production',
      description: 'Shakespeare’s masterpiece drama performed live by world-renowned Shakespearean actors.',
      eventType: EventType.THEATRE,
      eventDate: new Date(Date.now() + 86400000 * 5),
      startTime: '18:30',
      venueId: venue1.id,
      imageUrl: 'https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?auto=format&fit=crop&w=1200&q=80',
      premPrice: 65.0,
      stdPrice: 40.0,
    },
    {
      title: 'The Phantom of the Opera',
      description: 'The legendary musical love story featuring haunting orchestral scores and dramatic theatrical sets.',
      eventType: EventType.THEATRE,
      eventDate: new Date(Date.now() + 86400000 * 12),
      startTime: '19:30',
      venueId: venue1.id,
      imageUrl: 'https://images.unsplash.com/photo-1469488865564-c2de10f69f96?auto=format&fit=crop&w=1200&q=80',
      premPrice: 120.0,
      stdPrice: 75.0,
    },

    // ⚽ SPORTS
    {
      title: 'India vs Australia T20 International Series',
      description: 'High-octane T20 cricket derby featuring world champions live in action.',
      eventType: EventType.SPORTS,
      eventDate: new Date(Date.now() + 86400000 * 8),
      startTime: '19:00',
      venueId: venue2.id,
      imageUrl: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=1200&q=80',
      premPrice: 250.0,
      stdPrice: 120.0,
    },
    {
      title: 'IPL Championship Final Derby',
      description: 'The ultimate T20 championship showdown packed with roaring crowds and trophy celebrations.',
      eventType: EventType.SPORTS,
      eventDate: new Date(Date.now() + 86400000 * 15),
      startTime: '19:30',
      venueId: venue2.id,
      imageUrl: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=1200&q=80',
      premPrice: 300.0,
      stdPrice: 150.0,
    },

    // 🎙️ COMEDY
    {
      title: 'Zakir Khan Live — Tathastu Standup',
      description: 'Unfiltered laughter, relatable stories, and iconic punchlines live with Zakir Khan.',
      eventType: EventType.COMEDY,
      eventDate: new Date(Date.now() + 86400000 * 6),
      startTime: '20:00',
      venueId: venue1.id,
      imageUrl: 'https://images.unsplash.com/photo-1585699324551-f6c309eedeca?auto=format&fit=crop&w=1200&q=80',
      premPrice: 50.0,
      stdPrice: 30.0,
    },
    {
      title: 'Anubhav Singh Bassi — Bas Kar Bassi',
      description: 'Non-stop hilarious storytelling about life, friends, and career choices.',
      eventType: EventType.COMEDY,
      eventDate: new Date(Date.now() + 86400000 * 14),
      startTime: '18:00',
      venueId: venue1.id,
      imageUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1200&q=80',
      premPrice: 45.0,
      stdPrice: 25.0,
    },

    // 🎨 WORKSHOPS
    {
      title: 'Mastering Pottery & Ceramics Workshop',
      description: 'Hands-on pottery wheel workshop guided by master ceramic sculptors with take-home creations.',
      eventType: EventType.WORKSHOP,
      eventDate: new Date(Date.now() + 86400000 * 9),
      startTime: '11:00',
      venueId: venue1.id,
      imageUrl: 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?auto=format&fit=crop&w=1200&q=80',
      premPrice: 75.0,
      stdPrice: 45.0,
    },
    {
      title: 'AI & Next.js Fullstack Masterclass',
      description: 'Build production-grade AI web applications with Next.js 14, NestJS, and vector databases.',
      eventType: EventType.WORKSHOP,
      eventDate: new Date(Date.now() + 86400000 * 11),
      startTime: '10:00',
      venueId: venue1.id,
      imageUrl: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=1200&q=80',
      premPrice: 99.0,
      stdPrice: 59.0,
    },
  ];

  for (const ed of eventsData) {
    const createdEvent = await prisma.event.create({
      data: {
        organiserId: organiser.id,
        venueId: ed.venueId,
        title: ed.title,
        description: ed.description,
        eventType: ed.eventType,
        eventDate: ed.eventDate,
        startTime: ed.startTime,
        imageUrl: ed.imageUrl,
        status: EventStatus.ON_SALE,
      },
    });

    const seatsToMap = ed.venueId === venue1.id ? venue1Seats : venue2Seats;
    for (const vs of seatsToMap) {
      await prisma.eventSeat.create({
        data: {
          eventId: createdEvent.id,
          venueSeatId: vs.id,
          category: vs.category,
          price: vs.category === SeatCategory.PREMIUM ? ed.premPrice : ed.stdPrice,
          status: SeatStatus.AVAILABLE,
        },
      });
    }
  }

  console.log('✅ Multi-category events created and mapped with seats');

  // 5. Create Food Stalls & Menus
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
      description: 'Artisanal burgers, loaded fries, and craft sodas.',
      location: 'Metropolitan Arena — Gate B VIP Concourse',
      imageUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80',
    },
  });

  await prisma.menuItem.createMany({
    data: [
      {
        stallId: stall1.id,
        name: 'Jumbo Butter Popcorn + Cola Combo',
        description: 'Large tub of warm butter popcorn with a 750ml fountain soda.',
        category: 'SNACK',
        price: 12.0,
        imageUrl: 'https://images.unsplash.com/photo-1578849278619-e73505e9610f?auto=format&fit=crop&w=500&q=80',
      },
      {
        stallId: stall1.id,
        name: 'Cheesy Jalapeño Nachos Bowl',
        description: 'Crispy tortilla chips smothered in warm cheese sauce & jalapeños.',
        category: 'SNACK',
        price: 9.5,
        imageUrl: 'https://images.unsplash.com/photo-1513456852971-30c0b8199d4d?auto=format&fit=crop&w=500&q=80',
      },
      {
        stallId: stall2.id,
        name: 'VIP Angus Beef Burger & Truffle Fries',
        description: 'Smash Angus patty, aged cheddar, truffle mayo, and Seasoned Fries.',
        category: 'MEAL',
        price: 18.5,
        imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=500&q=80',
      },
    ],
  });

  console.log('✅ Food stalls & menu combos created');

  // 6. Food Coupons & Proof of Partnership
  const proof = await prisma.partnershipProof.create({
    data: {
      organiserId: organiser.id,
      foodStallId: stall1.id,
      partnerName: 'PVR Gourmet Popcorn Partner Contract',
      documentUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
      agreementRef: 'AGR-POPCORN-2025-001',
      status: 'APPROVED',
    },
  });

  await prisma.foodCoupon.createMany({
    data: [
      {
        partnershipId: proof.id,
        foodStallId: stall1.id,
        code: 'POPCORN15',
        title: '15% Off Popcorn Combos',
        description: 'Enjoy 15% discount on all gourmet popcorn and beverages.',
        discountPercent: 15.0,
        minSpend: 20.0,
        isActive: true,
      },
      {
        partnershipId: proof.id,
        foodStallId: stall1.id,
        code: 'FEAST5',
        title: '$5 Off Feast Combos',
        description: 'Save $5 flat on all arena meals over $15.',
        discountAmount: 5.0,
        minSpend: 15.0,
        isActive: true,
      },
    ],
  });

  console.log('✅ Partnership proof & food coupons created');
  console.log('🎉 Database seeding complete across Movies, Concerts, Plays, Sports, Comedy, and Workshops!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
