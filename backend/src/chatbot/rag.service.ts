import { Injectable, Logger } from '@nestjs/common';

export interface RAGKnowledgeDoc {
  id: string;
  category: 'POLICY' | 'FAQ' | 'ACTIVITY' | 'BOOKING_MODEL';
  title: string;
  content: string;
}

@Injectable()
export class RAGService {
  private readonly logger = new Logger(RAGService.name);

  // Trusted System Knowledge Base Store (grounded documents)
  private readonly knowledgeBase: RAGKnowledgeDoc[] = [
    {
      id: 'doc-1',
      category: 'POLICY',
      title: 'Seat Hold & Expiration Policy',
      content:
        'When a user selects seats, an atomic Redis lock and Postgres row lock place a 10-minute hold (TTL). If payment signature verification is not completed within 10 minutes, the hold expires and seats auto-release to available status.',
    },
    {
      id: 'doc-2',
      category: 'POLICY',
      title: 'Refund & Cancellation Policy',
      content:
        'Bookings can be cancelled up to 24 hours prior to the event start date for a full refund. Cancellations made within 24 hours of the start time are non-refundable. Auto waitlist re-allocation is triggered upon cancellation.',
    },
    {
      id: 'doc-3',
      category: 'ACTIVITY',
      title: 'Supported Activity Types and Booking Models',
      content:
        'The platform supports 10 activity types: Cinema (Seat), Theatre (Seat/Table), Concert (General Admission/Seat), Workshop (Capacity/Slot), Sports (Seat/Team), Game (Slot/Team), Exhibition (General Admission/Slot), Conference (Seat/Capacity), Amusement (Slot/Capacity), and Custom (Other).',
    },
    {
      id: 'doc-4',
      category: 'FAQ',
      title: 'E-Tickets and QR Verification',
      content:
        'After successful payment, HMAC-SHA256 signed QR e-tickets are generated and emailed. Venue staff scan QR codes at entry gates for instant check-in.',
    },
    {
      id: 'doc-5',
      category: 'BOOKING_MODEL',
      title: 'Difference between RAG and Live Backend Data',
      content:
        'RAG is used for static knowledge, policies, and FAQs. Live seat availability, current pricing, and user reservations are ALWAYS fetched live from the PostgreSQL database engine.',
    },
  ];

  /**
   * Search knowledge base for relevant context snippets matching user query.
   */
  async retrieveContext(query: string): Promise<string> {
    const q = query.toLowerCase();
    const matches = this.knowledgeBase.filter(
      (doc) =>
        doc.title.toLowerCase().includes(q) ||
        doc.content.toLowerCase().includes(q) ||
        q.split(' ').some((word) => word.length > 3 && doc.content.toLowerCase().includes(word)),
    );

    const relevantDocs = matches.length > 0 ? matches : this.knowledgeBase.slice(0, 3);
    return relevantDocs.map((d) => `[${d.title}]: ${d.content}`).join('\n\n');
  }
}
