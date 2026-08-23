import {
  PrismaClient,
  Role,
  EventType,
  EventStatus,
  SeatCategory,
  SeatStatus,
} from '@prisma/client';

const ActivityType = {
  CINEMA: 'CINEMA',
  THEATRE: 'THEATRE',
  CONCERT: 'CONCERT',
  WORKSHOP: 'WORKSHOP',
  SPORTS: 'SPORTS',
  GAME: 'GAME',
  EXHIBITION: 'EXHIBITION',
  CONFERENCE: 'CONFERENCE',
  AMUSEMENT: 'AMUSEMENT',
  OTHER: 'OTHER',
};

const BookingModel = {
  SEAT: 'SEAT',
  GENERAL_ADMISSION: 'GENERAL_ADMISSION',
  CAPACITY: 'CAPACITY',
  SLOT: 'SLOT',
  TABLE: 'TABLE',
  TEAM: 'TEAM',
  PASS: 'PASS',
  CUSTOM: 'CUSTOM',
};

import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient() as any;

const D = (days: number) => new Date(Date.now() + 86400000 * days);

async function main() {
  console.log('🌱 Starting database seed with 10x8 ActivityType x BookingModel matrix...');

  // ── Clean slate ───────────────────────────────────────────────────────────
  await prisma.wishlist.deleteMany();
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

  // ── Create Users ──────────────────────────────────────────────────────────
  const admin = await prisma.user.create({
    data: { name: 'System Admin', email: 'admin@ticketbooking.com', passwordHash, role: Role.ADMIN },
  });

  const organiser1 = await prisma.user.create({
    data: { name: 'Apex Blockbuster Events', email: 'organiser@apexevents.com', passwordHash, role: Role.ORGANISER },
  });
  const organiser2 = await prisma.user.create({
    data: { name: 'Starwave Concerts & Sports', email: 'organiser@starwave.com', passwordHash, role: Role.ORGANISER },
  });
  const organiser3 = await prisma.user.create({
    data: { name: 'Laughter & Theatre Guild', email: 'organiser@theatreguild.com', passwordHash, role: Role.ORGANISER },
  });

  // Test customers
  await prisma.user.create({
    data: { name: 'John Doe', email: 'john@example.com', passwordHash, role: Role.CUSTOMER },
  });
  await prisma.user.create({
    data: { name: 'Priya Sharma', email: 'priya@example.com', passwordHash, role: Role.CUSTOMER },
  });

  console.log('✅ Users created');

  // ── Create Venues ─────────────────────────────────────────────────────────
  const mkVenue = (name: string, location: string, imageUrl: string) =>
    prisma.venue.create({
      data: { name, location, imageUrl, createdById: admin.id },
    });

  const cinemaVenue = await mkVenue(
    'PVR IMAX Cineplex',
    'Downtown Plaza, Lower Parel, Mumbai',
    'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1200&q=80'
  );
  const stadiumVenue = await mkVenue(
    'DY Patil International Stadium',
    'Sector 7, Nerul, Navi Mumbai',
    'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?auto=format&fit=crop&w=1200&q=80'
  );
  const theatreVenue = await mkVenue(
    'Royal Opera House Theatre',
    'Mathew Road, Girgaon, South Mumbai',
    'https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?auto=format&fit=crop&w=1200&q=80'
  );
  const loungeVenue = await mkVenue(
    'The Comedy & Workshop Lounge',
    'Linking Road, Bandra West, Mumbai',
    'https://images.unsplash.com/photo-1585699324551-f6c309eedeca?auto=format&fit=crop&w=1200&q=80'
  );
  const expoVenue = await mkVenue(
    'Expo Convention Centre',
    'BKC, Bandra East, Mumbai',
    'https://images.unsplash.com/photo-1501504905252-473c47e087f8?auto=format&fit=crop&w=1200&q=80'
  );
  const parkVenue = await mkVenue(
    'Wonderland Theme Park & Resort',
    'Ghodbunder Road, Thane, Mumbai',
    'https://images.unsplash.com/photo-1617196034183-421b4040ed20?auto=format&fit=crop&w=1200&q=80'
  );

  console.log('✅ 6 Venues created');

  // ── Create Seats for Venues ────────────────────────────────────────────────
  const mkSeats = async (venueId: string, rowCount: number, seatsPerRow: number) => {
    const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'].slice(0, rowCount);
    const seats: { id: string; category: SeatCategory }[] = [];
    for (const r of rows) {
      const category = ['A', 'B'].includes(r) ? SeatCategory.PREMIUM : SeatCategory.STANDARD;
      for (let s = 1; s <= seatsPerRow; s++) {
        const seat = await prisma.venueSeat.create({
          data: { venueId, rowNumber: r, seatNumber: s, category },
        });
        seats.push({ id: seat.id, category: seat.category });
      }
    }
    return seats;
  };

  const seatsCinema = await mkSeats(cinemaVenue.id, 6, 8); // 48 seats
  const seatsStadium = await mkSeats(stadiumVenue.id, 8, 10); // 80 seats
  const seatsTheatre = await mkSeats(theatreVenue.id, 6, 8); // 48 seats
  const seatsLounge = await mkSeats(loungeVenue.id, 5, 8); // 40 seats
  const seatsExpo = await mkSeats(expoVenue.id, 6, 10); // 60 seats
  const seatsPark = await mkSeats(parkVenue.id, 4, 8); // 32 seats

  console.log('✅ Venue seats created');

  const activityTypes = Object.values((ActivityType as any) || {});
  const bookingModels = Object.values((BookingModel as any) || {});

  const getVenueAndSeats = (actType: any) => {
    switch (actType) {
      case (ActivityType as any).CINEMA:
        return { venue: cinemaVenue, seats: seatsCinema };
      case ActivityType.THEATRE:
        return { venue: theatreVenue, seats: seatsTheatre };
      case ActivityType.CONCERT:
        return { venue: stadiumVenue, seats: seatsStadium };
      case ActivityType.SPORTS:
      case ActivityType.GAME:
        return { venue: stadiumVenue, seats: seatsStadium };
      case ActivityType.WORKSHOP:
      case ActivityType.CONFERENCE:
      case ActivityType.EXHIBITION:
        return { venue: expoVenue, seats: seatsExpo };
      case ActivityType.AMUSEMENT:
        return { venue: parkVenue, seats: seatsPark };
      default:
        return { venue: loungeVenue, seats: seatsLounge };
    }
  };

  const getEventType = (actType: any): any => {
    switch (actType) {
      case (ActivityType as any).CINEMA:
        return EventType.MOVIE;
      case ActivityType.THEATRE:
        return EventType.THEATRE;
      case ActivityType.CONCERT:
      case ActivityType.AMUSEMENT:
        return EventType.CONCERT;
      case ActivityType.SPORTS:
      case ActivityType.GAME:
        return EventType.SPORTS;
      case ActivityType.WORKSHOP:
      case ActivityType.EXHIBITION:
      case ActivityType.CONFERENCE:
        return EventType.WORKSHOP;
      default:
        return EventType.COMEDY;
    }
  };

  const getResourceConfig = (model: any) => {
    switch (model) {
      case (BookingModel as any).GENERAL_ADMISSION:
        return {
          zones: [
            { name: 'Front Standing (VIP)', capacity: 40, price: 2000 },
            { name: 'General Admission Arena', capacity: 160, price: 800 },
          ],
        };
      case BookingModel.CAPACITY:
        return {
          totalCapacity: 150,
          price: 900,
        };
      case BookingModel.SLOT:
        return {
          slots: [
            { time: '10:00', duration: 90, capacity: 25, price: 1000 },
            { time: '13:30', duration: 90, capacity: 25, price: 1000 },
            { time: '17:00', duration: 120, capacity: 35, price: 1400 },
          ],
        };
      case BookingModel.TABLE:
        return {
          tables: [
            { name: 'VIP Front Table (4 pax)', price: 3000 },
            { name: 'Standard Central Table (4 pax)', price: 2000 },
            { name: 'Lounge Standing Table (2 pax)', price: 1000 },
          ],
        };
      case BookingModel.TEAM:
        return {
          teamSize: 4,
          maxTeams: 20,
          pricePerTeam: 2400,
        };
      case BookingModel.PASS:
        return {
          passes: [
            { name: 'Single Day Entry Pass', price: 500 },
            { name: 'VIP Weekend All-Access Pass', price: 1200 },
          ],
        };
      case BookingModel.CUSTOM:
        return {
          note: 'Interactive customizable pods. Choose pod size and food preference at checkout.',
          pricingDetails: 'Pods range from 1200 to 4500 based on selection.',
        };
      default:
        return null;
    }
  };

  const getEventImage = (actType: any, index: number) => {
    const images: Record<any, string[]> = {
      CINEMA: [
        'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=800&q=80',
      ],
      THEATRE: [
        'https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1469488865564-c2de10f69f96?auto=format&fit=crop&w=800&q=80',
      ],
      CONCERT: [
        'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=800&q=80',
      ],
      SPORTS: [
        'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=800&q=80',
      ],
      GAME: [
        'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=800&q=80',
      ],
      WORKSHOP: [
        'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?auto=format&fit=crop&w=800&q=80',
      ],
      EXHIBITION: [
        'https://images.unsplash.com/photo-1578662996442-48f60103fc96?auto=format&fit=crop&w=800&q=80',
      ],
      CONFERENCE: [
        'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?auto=format&fit=crop&w=800&q=80',
      ],
      AMUSEMENT: [
        'https://images.unsplash.com/photo-1617196034183-421b4040ed20?auto=format&fit=crop&w=800&q=80',
      ],
      OTHER: [
        'https://images.unsplash.com/photo-1585699324551-f6c309eedeca?auto=format&fit=crop&w=800&q=80',
      ],
    };
    const arr = images[actType] || images.OTHER;
    return arr[index % arr.length];
  };

  const getTrailerUrl = (actType: any, index: number) => {
    if (actType === (ActivityType as any).CINEMA) {
      return index % 2 === 0
        ? 'https://www.youtube.com/watch?v=TcMBFSGVi1c'
        : 'https://www.youtube.com/watch?v=Way9Dexny3w';
    }
    return null;
  };

  let eventIndex = 0;
  console.log('⏳ Seeding all combinations of ActivityType (10) x BookingModel (8) = 80 events...');

  for (const actType of activityTypes as any[]) {
    const { venue, seats } = getVenueAndSeats(actType);
    const eventType = getEventType(actType);

    for (const model of bookingModels as any[]) {
      eventIndex++;

      // Distribute organizers
      const organiserId =
        eventIndex % 3 === 0
          ? organiser3.id
          : eventIndex % 2 === 0
          ? organiser2.id
          : organiser1.id;

      const title = `${actType.charAt(0) + actType.slice(1).toLowerCase()} - ${model.replace('_', ' ')} Seating Showcase`;
      const description = `This is a premium ${eventType.toLowerCase()} event configured under the ${model.replace('_', ' ')} booking model. Perfect for demonstrating dynamic ticket allocation, hold states, and real-time inventory management.`;
      
      const config = getResourceConfig(model);

      const createdEvent = await prisma.event.create({
        data: {
          organiserId,
          venueId: venue.id,
          title,
          description,
          eventType,
          activityType: actType,
          bookingModel: model,
          resourceConfig: config ? config : undefined,
          eventDate: D(3 + eventIndex % 30), // Spaced out dates
          startTime: eventIndex % 2 === 0 ? '19:30' : '15:00',
          imageUrl: getEventImage(actType, eventIndex),
          trailerUrl: getTrailerUrl(actType, eventIndex),
          status: EventStatus.ON_SALE,
        },
      });

      // Create seats mapping with standard pricing
      for (const vs of seats) {
        const seatPrice = vs.category === SeatCategory.PREMIUM ? 1200.0 : 600.0;
        await prisma.eventSeat.create({
          data: {
            eventId: createdEvent.id,
            venueSeatId: vs.id,
            category: vs.category,
            price: seatPrice,
            status: SeatStatus.AVAILABLE,
          },
        });
      }
    }
  }

  console.log(`✅ ${eventIndex} Matrix Events created successfully`);

  // ── Create Food Stalls & Menus ─────────────────────────────────────────────
  const cinemaStall = await prisma.foodStall.create({
    data: {
      venueId: cinemaVenue.id,
      name: 'Cinema Gourmet Hub',
      description: 'Artisan popcorn, cheese nachos, and chilled craft sodas.',
      location: 'PVR IMAX — Main Lobby Counter',
      imageUrl: 'https://images.unsplash.com/photo-1585647347483-22b66260dfff?auto=format&fit=crop&w=800&q=80',
    },
  });

  await prisma.menuItem.createMany({
    data: [
      {
        stallId: cinemaStall.id,
        name: 'Jumbo Butter Popcorn + Soda Combo',
        description: 'Warm buttered popcorn with a 750ml large fountain soda.',
        category: 'SNACK',
        price: 450.0,
        imageUrl: 'https://images.unsplash.com/photo-1578849278619-e73505e9610f?auto=format&fit=crop&w=500&q=80',
      },
      {
        stallId: cinemaStall.id,
        name: 'Loaded Cheese Nachos',
        description: 'Tortilla chips drenched in warm cheese sauce and jalapeños.',
        category: 'SNACK',
        price: 320.0,
        imageUrl: 'https://images.unsplash.com/photo-1513456852971-30c0b8199d4d?auto=format&fit=crop&w=500&q=80',
      },
    ],
  });

  const partnership = await prisma.partnershipProof.create({
    data: {
      organiserId: organiser1.id,
      foodStallId: cinemaStall.id,
      partnerName: 'PVR Food Partner Contract',
      documentUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
      agreementRef: 'AGR-POPCORN-2026-99',
      status: 'APPROVED',
    },
  });

  await prisma.foodCoupon.createMany({
    data: [
      {
        partnershipId: partnership.id,
        foodStallId: cinemaStall.id,
        code: 'POPCORN15',
        title: '15% Off Popcorn Combos',
        description: 'Get 15% discount on all cinema popcorn bundles.',
        discountPercent: 15.0,
        minSpend: 500.0,
        isActive: true,
      },
      {
        partnershipId: partnership.id,
        foodStallId: cinemaStall.id,
        code: 'WELCOME20',
        title: 'Welcome Discount',
        description: 'Enjoy 20% off your first food order.',
        discountPercent: 20.0,
        minSpend: 300.0,
        isActive: true,
      },
    ],
  });

  console.log('✅ Food items and partnership coupons created');
  console.log('🎉 Database seeding complete! Matrix contains 80 fully-configured test events.');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
