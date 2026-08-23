import {
  PrismaClient,
  Role,
  EventType,
  ActivityType,
  BookingModel,
  EventStatus,
  SeatStatus,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient() as any;
const D = (days: number) => new Date(Date.now() + 86400000 * days);

async function main() {
  console.log('🌱 Seeding database with test events for ALL booking models (Seat, Zone, Slot, Capacity, Table, Team, Pass)...');

  // 1. Clean slate
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
  await prisma.venueHall.deleteMany();
  await prisma.venue.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash('Password123!', 10);

  // 2. Create User Accounts
  const customer = await prisma.user.create({
    data: {
      name: 'Customer User',
      email: 'customer@example.com',
      passwordHash,
      role: Role.CUSTOMER,
    },
  });

  const organizer = await prisma.user.create({
    data: {
      name: 'Organizer User',
      email: 'organizer@example.com',
      passwordHash,
      role: Role.ORGANISER,
    },
  });

  const admin = await prisma.user.create({
    data: {
      name: 'Admin User',
      email: 'admin@example.com',
      passwordHash,
      role: Role.ADMIN,
    },
  });

  console.log('✅ Users created: Customer, Organizer, Admin (Password: Password123!)');

  // 3. Create Venues with Specialized Layouts

  // Venue 1: Cinema Multiplex (SEAT layout)
  const imaxVenue = await prisma.venue.create({
    data: {
      name: 'PVR IMAX Cineplex',
      location: 'Downtown Mall, Lower Parel, Mumbai',
      imageUrl: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1200&q=80',
      createdById: admin.id,
    },
  });

  const imaxHall = await prisma.venueHall.create({
    data: {
      venueId: imaxVenue.id,
      name: 'Auditorium 1 (IMAX Laser)',
    },
  });

  const rows = ['A', 'B', 'C', 'D', 'E', 'F'];
  const seatsData: any[] = [];
  rows.forEach((row, rowIdx) => {
    for (let seatNum = 1; seatNum <= 10; seatNum++) {
      let category: any = 'STANDARD';
      if (rowIdx === 0) category = 'VIP';
      else if (rowIdx === 1 || rowIdx === 2) category = 'PREMIUM';
      else if (rowIdx === 5 && (seatNum === 1 || seatNum === 10)) category = 'ACCESSIBLE';

      seatsData.push({
        venueId: imaxVenue.id,
        hallId: imaxHall.id,
        rowNumber: row,
        seatNumber: seatNum,
        category,
      });
    }
  });

  await prisma.venueSeat.createMany({ data: seatsData });
  const imaxVenueSeats = await prisma.venueSeat.findMany({ where: { venueId: imaxVenue.id } });

  // Venue 2: Concert Ground (GENERAL_ADMISSION)
  const concertVenue = await prisma.venue.create({
    data: {
      name: 'Starwave Open-Air Arena',
      location: 'Bandra Kurla Complex, Mumbai',
      imageUrl: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?auto=format&fit=crop&w=1200&q=80',
      createdById: admin.id,
    },
  });

  // Venue 3: Theatre Auditorium (Irregular balcony & orchestra)
  const theatreVenue = await prisma.venue.create({
    data: {
      name: 'Royal Opera House',
      location: 'Girgaon, South Mumbai',
      imageUrl: 'https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?auto=format&fit=crop&w=1200&q=80',
      createdById: admin.id,
    },
  });

  const theatreHall = await prisma.venueHall.create({
    data: {
      venueId: theatreVenue.id,
      name: 'Main Symphony Stage',
    },
  });

  const theatreSeatsData: any[] = [];
  ['Orchestra-A', 'Orchestra-B', 'Balcony-1', 'VIP-Box'].forEach((row) => {
    for (let s = 1; s <= 8; s++) {
      let category: any = 'STANDARD';
      if (row.includes('VIP')) category = 'VIP';
      else if (row.includes('Orchestra')) category = 'PREMIUM';

      theatreSeatsData.push({
        venueId: theatreVenue.id,
        hallId: theatreHall.id,
        rowNumber: row,
        seatNumber: s,
        category,
      });
    }
  });
  await prisma.venueSeat.createMany({ data: theatreSeatsData });
  const theatreVenueSeats = await prisma.venueSeat.findMany({ where: { venueId: theatreVenue.id } });

  // Venue 4: Sports Stadium
  const stadiumVenue = await prisma.venue.create({
    data: {
      name: 'Apex National Stadium',
      location: 'Marine Drive, Mumbai',
      imageUrl: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=1200&q=80',
      createdById: admin.id,
    },
  });

  // Venue 5: Workshop Space (CAPACITY)
  const workshopVenue = await prisma.venue.create({
    data: {
      name: 'Innovation Tech Hub',
      location: 'Cyber City, Sector 44, Gurugram',
      imageUrl: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=1200&q=80',
      createdById: admin.id,
    },
  });

  // Venue 6: Game Arena (SLOT layout)
  const gameVenue = await prisma.venue.create({
    data: {
      name: 'CyberVR Gaming Arena',
      location: 'Indiranagar 100ft Road, Bengaluru',
      imageUrl: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=1200&q=80',
      createdById: admin.id,
    },
  });

  // Venue 7: Comedy Club Lounge (TABLE layout)
  const tableVenue = await prisma.venue.create({
    data: {
      name: 'The Comedy Club & Dinner Lounge',
      location: 'Bandra West, Mumbai',
      imageUrl: 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=1200&q=80',
      createdById: admin.id,
    },
  });

  // Venue 8: Esports Arena (TEAM layout)
  const teamVenue = await prisma.venue.create({
    data: {
      name: 'CyberTurf Esports Arena',
      location: 'HSR Layout, Bengaluru',
      imageUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1200&q=80',
      createdById: admin.id,
    },
  });

  // Venue 9: Exhibition Centre (PASS layout)
  const passVenue = await prisma.venue.create({
    data: {
      name: 'Pragati Maidan Exhibition Centre',
      location: 'Pragati Maidan, New Delhi',
      imageUrl: 'https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?auto=format&fit=crop&w=1200&q=80',
      createdById: admin.id,
    },
  });

  console.log('✅ 9 Venues created for all booking model types');

  // 4. Create Test Events for Each Activity & Booking Model

  // Event 1: Movie Screening (MOVIE + SEAT)
  const movieEvent = await prisma.event.create({
    data: {
      organiserId: organizer.id,
      venueId: imaxVenue.id,
      hallId: imaxHall.id,
      title: 'Interstellar 4K IMAX 10th Anniversary Experience',
      description: 'Experience Christopher Nolan’s sci-fi masterpiece in 70mm IMAX format with immersive Dolby Atmos audio.',
      eventType: EventType.MOVIE,
      activityType: ActivityType.CINEMA,
      bookingModel: BookingModel.SEAT,
      eventDate: D(5),
      startTime: '19:30',
      imageUrl: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=1200&q=80',
      trailerUrl: 'https://www.youtube.com/watch?v=zSWdZVtXT7E',
      status: EventStatus.ON_SALE,
    },
  });

  await prisma.eventSeat.createMany({
    data: imaxVenueSeats.map((vs: any) => {
      let price = 300;
      if (vs.category === 'VIP') price = 800;
      else if (vs.category === 'PREMIUM') price = 500;
      else if (vs.category === 'ACCESSIBLE') price = 300;

      return {
        eventId: movieEvent.id,
        venueSeatId: vs.id,
        category: vs.category,
        price,
        status: SeatStatus.AVAILABLE,
      };
    }),
  });

  // Event 2: Concert (CONCERT + GENERAL_ADMISSION)
  await prisma.event.create({
    data: {
      organiserId: organizer.id,
      venueId: concertVenue.id,
      title: 'Coldplay — Music of the Spheres World Tour Live',
      description: 'The iconic band performing live under the stars featuring VIP Front Pit standing and General Admission zones.',
      eventType: EventType.CONCERT,
      activityType: ActivityType.CONCERT,
      bookingModel: BookingModel.GENERAL_ADMISSION,
      resourceConfig: {
        zones: [
          { id: '1', name: 'VIP Front Pit Standing', capacity: 300, price: 9500, entryGate: 'Gate VIP A' },
          { id: '2', name: 'General Admission Floor', capacity: 2500, price: 3500, entryGate: 'Gate Main B' },
        ],
        totalCapacity: 2800,
      },
      eventDate: D(7),
      startTime: '20:00',
      imageUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1200&q=80',
      status: EventStatus.ON_SALE,
    },
  });

  // Event 3: Theatre Play (THEATRE + SEAT)
  const theatreEvent = await prisma.event.create({
    data: {
      organiserId: organizer.id,
      venueId: theatreVenue.id,
      hallId: theatreHall.id,
      title: 'The Phantom of the Opera Broadway Live Production',
      description: 'Andrew Lloyd Webber’s legendary musical masterpiece live on stage with live orchestra.',
      eventType: EventType.THEATRE,
      activityType: ActivityType.THEATRE,
      bookingModel: BookingModel.SEAT,
      eventDate: D(6),
      startTime: '18:30',
      imageUrl: 'https://images.unsplash.com/photo-1460723237483-7a6dc9d0b212?auto=format&fit=crop&w=1200&q=80',
      status: EventStatus.ON_SALE,
    },
  });

  await prisma.eventSeat.createMany({
    data: theatreVenueSeats.map((vs: any) => {
      let price = 1200;
      if (vs.category === 'VIP') price = 3500;
      else if (vs.category === 'PREMIUM') price = 2200;

      return {
        eventId: theatreEvent.id,
        venueSeatId: vs.id,
        category: vs.category,
        price,
        status: SeatStatus.AVAILABLE,
      };
    }),
  });

  // Event 4: Live Sports (SPORTS + SEAT)
  await prisma.event.create({
    data: {
      organiserId: organizer.id,
      venueId: stadiumVenue.id,
      title: 'ISL Super Cup Football Final — Mumbai City FC vs Mohun Bagan',
      description: 'Championship final match live at Apex National Stadium with VIP Stands and West Stand seating.',
      eventType: EventType.SPORTS,
      activityType: ActivityType.SPORTS,
      bookingModel: BookingModel.SEAT,
      eventDate: D(10),
      startTime: '19:00',
      imageUrl: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=1200&q=80',
      status: EventStatus.ON_SALE,
    },
  });

  // Event 5: Workshop (WORKSHOP + CAPACITY)
  await prisma.event.create({
    data: {
      organiserId: organizer.id,
      venueId: workshopVenue.id,
      title: 'AI Agentic Architecture & RAG Masterclass',
      description: 'Hands-on intensive masterclass on building autonomous LLM agents, vector embeddings, and real-time concurrency engines.',
      eventType: EventType.WORKSHOP,
      activityType: ActivityType.WORKSHOP,
      bookingModel: BookingModel.CAPACITY,
      resourceConfig: {
        maxParticipants: 50,
        registrationCutoffHours: 12,
        includedMaterials: ['Notebook', 'API Credits', 'Certificate'],
      },
      eventDate: D(4),
      startTime: '10:00',
      imageUrl: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=1200&q=80',
      status: EventStatus.ON_SALE,
    },
  });

  // Event 6: Game (GAME + SLOT)
  await prisma.event.create({
    data: {
      organiserId: organizer.id,
      venueId: gameVenue.id,
      title: 'Cyberpunk VR Escape Room Challenge',
      description: 'Immersive multiplayer VR escape room session for teams of 2 to 6 players with 60-minute time slots.',
      eventType: EventType.COMEDY,
      activityType: ActivityType.GAME,
      bookingModel: BookingModel.SLOT,
      resourceConfig: {
        slots: [
          { id: 'slot-1', startTime: '11:00', endTime: '12:00', durationMinutes: 60, maxCapacity: 6, pricePerPerson: 799 },
          { id: 'slot-2', startTime: '13:00', endTime: '14:00', durationMinutes: 60, maxCapacity: 6, pricePerPerson: 799 },
          { id: 'slot-3', startTime: '15:00', endTime: '16:00', durationMinutes: 60, maxCapacity: 6, pricePerPerson: 799 },
        ],
      },
      eventDate: D(4),
      startTime: '11:00',
      imageUrl: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=1200&q=80',
      status: EventStatus.ON_SALE,
    },
  });

  // Event 7: Standup Comedy & Dinner (COMEDY + TABLE)
  await prisma.event.create({
    data: {
      organiserId: organizer.id,
      venueId: tableVenue.id,
      title: 'Late Night Standup Comedy & Fine Dining Cabaret',
      description: 'Top standup comedians performing live with table service dining. Reserve VIP or 4-Seater Dining Tables.',
      eventType: EventType.COMEDY,
      activityType: ActivityType.OTHER,
      bookingModel: BookingModel.TABLE,
      resourceConfig: {
        tables: [
          { id: 'tbl-1', name: 'VIP Front Stage Table 1 (4 Seats)', capacity: 4, price: 3200 },
          { id: 'tbl-2', name: 'VIP Front Stage Table 2 (4 Seats)', capacity: 4, price: 3200 },
          { id: 'tbl-3', name: 'Couples Dining Table 3 (2 Seats)', capacity: 2, price: 1800 },
          { id: 'tbl-4', name: 'Standard Table 4 (4 Seats)', capacity: 4, price: 2400 },
        ],
      },
      eventDate: D(5),
      startTime: '21:00',
      imageUrl: 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=1200&q=80',
      status: EventStatus.ON_SALE,
    },
  });

  // Event 8: Esports Tournament (GAME + TEAM)
  await prisma.event.create({
    data: {
      organiserId: organizer.id,
      venueId: teamVenue.id,
      title: 'Valorant & BGMI Esports Invitational Cup 2026',
      description: 'Register your 5-player squad for the national esports tournament with ₹1,00,000 prize pool.',
      eventType: EventType.SPORTS,
      activityType: ActivityType.GAME,
      bookingModel: BookingModel.TEAM,
      resourceConfig: {
        team: {
          maxTeams: 16,
          minTeamSize: 5,
          maxTeamSize: 7,
          registrationFee: 2500,
        },
      },
      eventDate: D(8),
      startTime: '12:00',
      imageUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1200&q=80',
      status: EventStatus.ON_SALE,
    },
  });

  // Event 9: Exhibition Pass (EXHIBITION + PASS)
  await prisma.event.create({
    data: {
      organiserId: organizer.id,
      venueId: passVenue.id,
      title: 'India International Tech Expo & AI Summit 2026',
      description: 'Asia’s largest technology exhibition featuring 500+ global keynotes, startup showcases, and networking sessions.',
      eventType: EventType.WORKSHOP,
      activityType: ActivityType.EXHIBITION,
      bookingModel: BookingModel.PASS,
      resourceConfig: {
        passes: [
          { id: 'pass-1', name: '3-Day VIP All-Access Pass', price: 4999, perks: 'Keynote Lounge + Gala Dinner' },
          { id: 'pass-2', name: '1-Day Delegate Pass', price: 1999, perks: 'Exhibition Floor Entry' },
          { id: 'pass-3', name: 'Student Exhibition Pass', price: 499, perks: 'Student Zone Entry' },
        ],
      },
      eventDate: D(12),
      startTime: '09:00',
      imageUrl: 'https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?auto=format&fit=crop&w=1200&q=80',
      status: EventStatus.ON_SALE,
    },
  });

  console.log('🎉 Database seeding complete! Successfully created test events for ALL booking models (SEAT, GENERAL_ADMISSION, CAPACITY, SLOT, TABLE, TEAM, PASS).');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
