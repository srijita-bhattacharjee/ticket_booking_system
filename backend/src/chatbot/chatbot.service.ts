import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../database/prisma.service';

export interface EventCard {
  id: string;
  title: string;
  eventType: string;
  eventDate: Date | string;
  startTime: string;
  venueName: string;
  minPrice: number;
  imageUrl?: string | null;
}

export interface ChatbotResponse {
  reply: string;
  eventCards?: EventCard[];
  quickReplies?: string[];
}

@Injectable()
export class ChatbotService {
  private readonly logger = new Logger(ChatbotService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  async handleQuery(message: string, userId?: string): Promise<ChatbotResponse> {
    const trimmedMessage = message.trim();
    const apiKey = this.configService.get<string>('GEMINI_API_KEY') || process.env.GEMINI_API_KEY;

    // Retrieve database context
    const events = await this.prisma.event.findMany({
      where: {
        status: { in: ['ON_SALE', 'UPCOMING'] },
      },
      include: {
        venue: true,
        seats: {
          select: { price: true },
        },
      },
      take: 10,
      orderBy: { eventDate: 'asc' },
    });

    const eventCards: EventCard[] = events.map((e) => {
      const prices = e.seats.map((s) => s.price);
      const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
      return {
        id: e.id,
        title: e.title,
        eventType: e.eventType,
        eventDate: e.eventDate,
        startTime: e.startTime,
        venueName: e.venue?.name || 'Venue',
        minPrice,
        imageUrl: e.imageUrl,
      };
    });

    let userBookings: any[] = [];
    if (userId) {
      userBookings = await this.prisma.booking.findMany({
        where: { userId },
        include: {
          event: {
            include: { venue: true },
          },
          seats: {
            include: {
              eventSeat: {
                include: { venueSeat: true },
              },
            },
          },
          tickets: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
      });
    }

    const foodCoupons = await this.prisma.foodCoupon.findMany({
      where: { isActive: true },
      include: { foodStall: true, event: true },
      take: 5,
    });

    // Try Gemini API if key is present
    if (apiKey) {
      try {
        const geminiReply = await this.callGeminiApi(apiKey, trimmedMessage, eventCards, userBookings, foodCoupons);
        if (geminiReply) {
          // If query asked about events or recommendations, attach matching event cards
          const matchedCards = this.filterRelevantCards(trimmedMessage, eventCards);
          return {
            reply: geminiReply,
            eventCards: matchedCards.length > 0 ? matchedCards : undefined,
            quickReplies: this.getSuggestedQuickReplies(trimmedMessage, userId),
          };
        }
      } catch (err: any) {
        this.logger.warn(`Gemini API call failed, falling back to local intent parser: ${err.message}`);
      }
    }

    // Fallback Intent Processor
    return this.processLocalIntent(trimmedMessage, eventCards, userBookings, foodCoupons, userId);
  }

  private filterRelevantCards(message: string, eventCards: EventCard[]): EventCard[] {
    const lower = message.toLowerCase();
    if (
      lower.includes('event') ||
      lower.includes('show') ||
      lower.includes('concert') ||
      lower.includes('movie') ||
      lower.includes('ticket') ||
      lower.includes('book') ||
      lower.includes('recommend') ||
      lower.includes('upcoming') ||
      lower.includes('price') ||
      lower.includes('what') ||
      lower.includes('find')
    ) {
      // Match specific type if mentioned
      if (lower.includes('concert')) {
        const filtered = eventCards.filter((e) => e.eventType.toLowerCase() === 'concert');
        if (filtered.length > 0) return filtered;
      }
      if (lower.includes('movie')) {
        const filtered = eventCards.filter((e) => e.eventType.toLowerCase() === 'movie');
        if (filtered.length > 0) return filtered;
      }
      if (lower.includes('comedy')) {
        const filtered = eventCards.filter((e) => e.eventType.toLowerCase() === 'comedy');
        if (filtered.length > 0) return filtered;
      }
      if (lower.includes('theatre') || lower.includes('theater')) {
        const filtered = eventCards.filter((e) => e.eventType.toLowerCase() === 'theatre');
        if (filtered.length > 0) return filtered;
      }
      return eventCards.slice(0, 4);
    }
    return [];
  }

  private async callGeminiApi(
    apiKey: string,
    userQuery: string,
    eventCards: EventCard[],
    userBookings: any[],
    foodCoupons: any[],
  ): Promise<string | null> {
    const systemContext = `
You are TicketBot, an enthusiastic, friendly AI assistant for the Ticket Booking System platform.
You assist customers in finding events, checking bookings, explaining seat hold timers, and discovering food deals.

CURRENT PLATFORM DATA CONTEXT:
1. Available Events:
${JSON.stringify(eventCards, null, 2)}

2. User's Recent Bookings (if logged in):
${userBookings.length > 0 ? JSON.stringify(userBookings.map(b => ({
  ref: b.bookingReference,
  event: b.event.title,
  date: b.event.eventDate,
  venue: b.event.venue.name,
  status: b.status,
  total: b.totalAmount,
  tickets: b.tickets.length
})), null, 2) : 'User is a Guest (Not logged in)'}

3. Active Food Coupons & Deals:
${JSON.stringify(foodCoupons.map(c => ({
  code: c.code,
  title: c.title,
  stall: c.foodStall?.name,
  discount: c.discountAmount ? `$${c.discountAmount} OFF` : `${c.discountPercent}% OFF`
})), null, 2)}

4. Platform Rules & FAQs:
- Seat Holds: Seats are held for 5 minutes during checkout. If payment is not finished, seats auto-release.
- Refunds: Bookings can be cancelled and refunded prior to event start date.
- QR Code Tickets: After booking confirmation, QR tickets are generated for venue entry check-in.

GUIDELINES:
- Be concise, clear, helpful, and friendly. Use formatting like bullet points or bold text where appropriate.
- If recommending events, mention their titles, dates, and starting prices.
- If user asks about their bookings but isn't logged in, remind them to log in to see personal bookings.
    `;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [{ text: `${systemContext}\n\nUser Question: ${userQuery}` }],
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`Gemini API HTTP Error ${response.status}`);
    }

    const data = await response.json();
    const replyText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    return replyText || null;
  }

  private processLocalIntent(
    query: string,
    eventCards: EventCard[],
    userBookings: any[],
    foodCoupons: any[],
    userId?: string,
  ): ChatbotResponse {
    const q = query.toLowerCase();

    // 1. Greetings
    if (q.includes('hi') || q.includes('hello') || q.includes('hey') || q.includes('greetings') || q === 'help') {
      return {
        reply: `👋 **Welcome to TicketBot!** I'm your assistant for tickets, event recommendations, booking status, and food deals.\n\nHow can I help you today? You can ask me things like:\n- *"What events are on sale?"*\n- *"Show my active bookings"*\n- *"What food coupons are available?"*\n- *"How does seat holding work?"*`,
        quickReplies: this.getSuggestedQuickReplies(q, userId),
      };
    }

    // 2. User Bookings & Tickets
    if (q.includes('booking') || q.includes('ticket') || q.includes('my order') || q.includes('reservation')) {
      if (!userId) {
        return {
          reply: `🔐 **You are currently browsing as a Guest.**\n\nPlease **Log In** to view your active ticket bookings, QR codes, and reservation history!`,
          quickReplies: ['Show Upcoming Events', 'Food Coupons', 'How Seat Hold Works'],
        };
      }

      if (userBookings.length === 0) {
        return {
          reply: `🎟️ You don't have any active bookings yet!\n\nCheck out our upcoming events below and book your tickets today!`,
          eventCards: eventCards.slice(0, 3),
          quickReplies: ['Show Upcoming Events', 'Food Coupons'],
        };
      }

      const bookingList = userBookings
        .map(
          (b) =>
            `• **Ref #${b.bookingReference}** - *${b.event?.title}*\n  📅 ${new Date(b.event?.eventDate).toLocaleDateString()} at ${b.event?.startTime} | 📍 ${b.event?.venue?.name}\n  Status: \`${b.status}\` | Total: $${b.totalAmount}`,
        )
        .join('\n\n');

      return {
        reply: `🎟️ **Here are your recent bookings:**\n\n${bookingList}\n\nYou can access your QR entry pass from the My Bookings section on the top menu!`,
        quickReplies: ['Show Upcoming Events', 'Food Coupons', 'How Seat Hold Works'],
      };
    }

    // 3. Food & Coupons
    if (q.includes('food') || q.includes('snack') || q.includes('coupon') || q.includes('drink') || q.includes('eat') || q.includes('offer')) {
      if (foodCoupons.length === 0) {
        return {
          reply: `🍕 **Food & Beverages**: Explore food stalls available at the venue during event seat selection to add snacks and drinks to your booking!`,
          quickReplies: ['Show Upcoming Events', 'My Bookings'],
        };
      }

      const couponText = foodCoupons
        .map((c) => {
          const discount = c.discountAmount ? `$${c.discountAmount} OFF` : `${c.discountPercent}% OFF`;
          return `🏷️ **Code: \`${c.code}\`** - ${c.title}\n  *${discount}* at **${c.foodStall?.name || 'Food Stall'}** (Min Spend: $${c.minSpend})`;
        })
        .join('\n\n');

      return {
        reply: `🍕 **Active Food & Snack Coupons:**\n\n${couponText}\n\nUse these coupon codes or select food add-ons when finalizing your booking checkout!`,
        quickReplies: ['Show Upcoming Events', 'My Bookings', 'How Seat Hold Works'],
      };
    }

    // 4. Seat Hold FAQs
    if (q.includes('hold') || q.includes('expire') || q.includes('timer') || q.includes('reserve') || q.includes('lock')) {
      return {
        reply: `⏱️ **How Seat Holding Works:**\n\n1. When you select seats on the interactive seat map, they are **held exclusively for 5 minutes**.\n2. A countdown timer will appear at the top of your screen.\n3. Complete payment before the timer expires to secure your tickets.\n4. If the timer runs out, held seats are automatically released for other fans!`,
        quickReplies: ['Show Upcoming Events', 'My Bookings', 'Food Coupons'],
      };
    }

    // 5. Refunds & Cancellation FAQs
    if (q.includes('refund') || q.includes('cancel') || q.includes('policy') || q.includes('money')) {
      return {
        reply: `💳 **Cancellation & Refund Policy:**\n\n- Bookings are eligible for full cancellation and refund prior to the event start date.\n- You can manage or cancel eligible orders directly under your **My Bookings** dashboard.`,
        quickReplies: ['My Bookings', 'Show Upcoming Events'],
      };
    }

    // 6. Event Searches & Recommendations (Default Event Query)
    let filtered = eventCards;
    if (q.includes('concert')) {
      filtered = eventCards.filter((e) => e.eventType.toLowerCase() === 'concert');
    } else if (q.includes('movie')) {
      filtered = eventCards.filter((e) => e.eventType.toLowerCase() === 'movie');
    } else if (q.includes('comedy')) {
      filtered = eventCards.filter((e) => e.eventType.toLowerCase() === 'comedy');
    } else if (q.includes('theatre') || q.includes('theater')) {
      filtered = eventCards.filter((e) => e.eventType.toLowerCase() === 'theatre');
    }

    if (filtered.length > 0) {
      return {
        reply: `✨ **Here are top events available for booking right now:**\n\nClick any event card below to view seat maps and book your tickets!`,
        eventCards: filtered.slice(0, 4),
        quickReplies: ['My Bookings', 'Food Coupons', 'How Seat Hold Works'],
      };
    }

    // 7. General Fallback
    return {
      reply: `I'm here to help! You can ask me to search events (*"Show me concerts"*), check your reservations (*"My bookings"*), or find food coupons.`,
      eventCards: eventCards.slice(0, 3),
      quickReplies: ['Show Upcoming Events', 'My Bookings', 'Food Coupons', 'How Seat Hold Works'],
    };
  }

  private getSuggestedQuickReplies(query: string, userId?: string): string[] {
    const defaultReplies = ['🎭 Upcoming Events', '🍕 Food Coupons', '⏱️ Seat Hold Info'];
    if (userId) {
      return ['🎟️ My Bookings', ...defaultReplies];
    }
    return defaultReplies;
  }
}
