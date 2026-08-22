import { PrismaClient, Role, EventType, EventStatus, SeatCategory, SeatStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed with multiple organisers, venues, and movie trailer URLs...');

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

  // 1. Create Admin & 3 Multiple Organisers & Customers
  const admin = await prisma.user.create({
    data: {
      name: 'System Admin',
      email: 'admin@ticketbooking.com',
      passwordHash,
      role: Role.ADMIN,
    },
  });

  const organiser1 = await prisma.user.create({
    data: {
      name: 'Apex Blockbuster Organiser',
      email: 'organiser@apexevents.com',
      passwordHash,
      role: Role.ORGANISER,
    },
  });

  const organiser2 = await prisma.user.create({
    data: {
      name: 'Starwave Concerts & Sports',
      email: 'organiser@starwave.com',
      passwordHash,
      role: Role.ORGANISER,
    },
  });

  const organiser3 = await prisma.user.create({
    data: {
      name: 'Laughter & Theatre Guild',
      email: 'organiser@theatreguild.com',
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

  console.log('✅ 3 Organisers & Users created');

  // 2. Create 4 Distinct Venues across Places
  const venue1 = await prisma.venue.create({
    data: {
      name: 'PVR IMAX Cineplex',
      location: 'Downtown Plaza, Lower Parel, Mumbai',
      imageUrl: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1200&q=80',
      createdById: admin.id,
    },
  });

  const venue2 = await prisma.venue.create({
    data: {
      name: 'DY Patil International Stadium',
      location: 'Sector 7, Nerul, Navi Mumbai',
      imageUrl: 'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?auto=format&fit=crop&w=1200&q=80',
      createdById: admin.id,
    },
  });

  const venue3 = await prisma.venue.create({
    data: {
      name: 'Royal Opera House Theatre',
      location: 'Mathew Road, Girgaon, South Mumbai',
      imageUrl: 'https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?auto=format&fit=crop&w=1200&q=80',
      createdById: admin.id,
    },
  });

  const venue4 = await prisma.venue.create({
    data: {
      name: 'The Comedy & Workshop Lounge',
      location: 'Linking Road, Bandra West, Mumbai',
      imageUrl: 'https://images.unsplash.com/photo-1585699324551-f6c309eedeca?auto=format&fit=crop&w=1200&q=80',
      createdById: admin.id,
    },
  });

  console.log('✅ 4 Distinct Venues created across places');

  // 3. Create Seats for Venues
  // Helper for generating venue seats
  const createVenueSeats = async (venueId: string, rowCount: number, seatCount: number) => {
    const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'].slice(0, rowCount);
    const seats = [];
    for (const r of rows) {
      const category = ['A', 'B'].includes(r) ? SeatCategory.PREMIUM : SeatCategory.STANDARD;
      for (let s = 1; s <= seatCount; s++) {
        const seat = await prisma.venueSeat.create({
          data: {
            venueId,
            rowNumber: r,
            seatNumber: s,
            category,
          },
        });
        seats.push(seat);
      }
    }
    return seats;
  };

  const venue1Seats = await createVenueSeats(venue1.id, 6, 8); // 48 seats
  const venue2Seats = await createVenueSeats(venue2.id, 8, 10); // 80 seats
  const venue3Seats = await createVenueSeats(venue3.id, 6, 8); // 48 seats
  const venue4Seats = await createVenueSeats(venue4.id, 5, 8); // 40 seats

  console.log('✅ Venue seats created for all 4 venues');

  // 4. Create Events Spread Across Organisers & Venues (with Movie Trailers!)
  const eventsData = [
    // 🎬 MOVIES (With Official Trailer Links)
    {
      organiserId: organiser1.id,
      venueId: venue1.id,
      title: 'Avengers: Endgame — Special Re-Screening',
      description: 'The epic finale of the Infinity Saga on the big screen with Dolby Atmos surround sound.',
      eventType: EventType.MOVIE,
      eventDate: new Date(Date.now() + 86400000 * 2),
      startTime: '18:00',
      imageUrl: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=1200&q=80',
      trailerUrl: 'https://www.youtube.com/watch?v=TcMBFSGVi1c',
      premPrice: 25.0,
      stdPrice: 15.0,
      seats: venue1Seats,
    },
    {
      organiserId: organiser1.id,
      venueId: venue1.id,
      title: 'Dune: Part Two (IMAX 3D Experience)',
      description: 'Follow Paul Atreides’ mythic journey on Arrakis in stunning IMAX 3D resolution.',
      eventType: EventType.MOVIE,
      eventDate: new Date(Date.now() + 86400000 * 4),
      startTime: '20:30',
      imageUrl: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1200&q=80',
      trailerUrl: 'https://www.youtube.com/watch?v=Way9Dexny3w',
      premPrice: 28.0,
      stdPrice: 18.0,
      seats: venue1Seats,
    },

    // 🎤 CONCERTS
    {
      organiserId: organiser2.id,
      venueId: venue2.id,
      title: 'Coldplay — Music of the Spheres World Tour',
      description: 'Live in concert featuring hit anthems Yellow, Viva La Vida, Fix You, and breathtaking light displays.',
      eventType: EventType.CONCERT,
      eventDate: new Date(Date.now() + 86400000 * 7),
      startTime: '20:00',
      imageUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1200&q=80',
      trailerUrl: null,
      premPrice: 150.0,
      stdPrice: 85.0,
      seats: venue2Seats,
    },
    {
      organiserId: organiser2.id,
      venueId: venue2.id,
      title: 'Diljit Dosanjh Live — Dil-Luminati Tour',
      description: 'Electrifying Punjabi pop experience live on stage with full live band performance.',
      eventType: EventType.CONCERT,
      eventDate: new Date(Date.now() + 86400000 * 10),
      startTime: '19:00',
      imageUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1200&q=80',
      trailerUrl: null,
      premPrice: 180.0,
      stdPrice: 95.0,
      seats: venue2Seats,
    },

    // 🎭 PLAYS / THEATRE
    {
      organiserId: organiser3.id,
      venueId: venue3.id,
      title: 'Hamlet — Globe Theatre Production',
      description: 'Shakespeare’s masterpiece drama performed live by world-renowned Shakespearean actors.',
      eventType: EventType.THEATRE,
      eventDate: new Date(Date.now() + 86400000 * 5),
      startTime: '18:30',
      imageUrl: 'https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?auto=format&fit=crop&w=1200&q=80',
      trailerUrl: null,
      premPrice: 65.0,
      stdPrice: 40.0,
      seats: venue3Seats,
    },
    {
      organiserId: organiser3.id,
      venueId: venue3.id,
      title: 'The Phantom of the Opera',
      description: 'The legendary musical love story featuring haunting orchestral scores and dramatic theatrical sets.',
      eventType: EventType.THEATRE,
      eventDate: new Date(Date.now() + 86400000 * 12),
      startTime: '19:30',
      imageUrl: 'https://images.unsplash.com/photo-1469488865564-c2de10f69f96?auto=format&fit=crop&w=1200&q=80',
      trailerUrl: null,
      premPrice: 120.0,
      stdPrice: 75.0,
      seats: venue3Seats,
    },

    // ⚽ SPORTS
    {
      organiserId: organiser2.id,
      venueId: venue2.id,
      title: 'India vs Australia T20 International Series',
      description: 'High-octane T20 cricket derby featuring world champions live in action.',
      eventType: EventType.SPORTS,
      eventDate: new Date(Date.now() + 86400000 * 8),
      startTime: '19:00',
      imageUrl: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=1200&q=80',
      trailerUrl: null,
      premPrice: 250.0,
      stdPrice: 120.0,
      seats: venue2Seats,
    },

    // 🎙️ COMEDY
    {
      organiserId: organiser3.id,
      venueId: venue4.id,
      title: 'Zakir Khan Live — Tathastu Standup',
      description: 'Unfiltered laughter, relatable stories, and iconic punchlines live with Zakir Khan.',
      eventType: EventType.COMEDY,
      eventDate: new Date(Date.now() + 86400000 * 6),
      startTime: '20:00',
      imageUrl: 'https://images.unsplash.com/photo-1585699324551-f6c309eedeca?auto=format&fit=crop&w=1200&q=80',
      trailerUrl: null,
      premPrice: 50.0,
      stdPrice: 30.0,
      seats: venue4Seats,
    },

    // 🎨 WORKSHOPS
    {
      organiserId: organiser3.id,
      venueId: venue4.id,
      title: 'Mastering Pottery & Ceramics Workshop',
      description: 'Hands-on pottery wheel workshop guided by master ceramic sculptors with take-home creations.',
      eventType: EventType.WORKSHOP,
      eventDate: new Date(Date.now() + 86400000 * 9),
      startTime: '11:00',
      imageUrl: 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?auto=format&fit=crop&w=1200&q=80',
      trailerUrl: null,
      premPrice: 75.0,
      stdPrice: 45.0,
      seats: venue4Seats,
    },
  ];

  for (const ed of eventsData) {
    const createdEvent = await prisma.event.create({
      data: {
        organiserId: ed.organiserId,
        venueId: ed.venueId,
        title: ed.title,
        description: ed.description,
        eventType: ed.eventType,
        eventDate: ed.eventDate,
        startTime: ed.startTime,
        imageUrl: ed.imageUrl,
        trailerUrl: ed.trailerUrl,
        status: EventStatus.ON_SALE,
      },
    });

    for (const vs of ed.seats) {
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

  console.log('✅ Events spread evenly across 3 Organisers & 4 Venues with Trailer URLs');

  // 5. Create Food Stalls & Menus
  const stall1 = await prisma.foodStall.create({
    data: {
      venueId: venue1.id,
      name: 'Cinema Gourmet Snacks & Soda Hub',
      description: 'Freshly buttered popcorn, artisan nachos, and iced beverages.',
      location: 'PVR IMAX Cineplex — Main Lobby Counter',
      imageUrl: 'https://images.unsplash.com/photo-1585647347483-22b66260dfff?auto=format&fit=crop&w=800&q=80',
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
    ],
  });

  const proof = await prisma.partnershipProof.create({
    data: {
      organiserId: organiser1.id,
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
    ],
  });

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
