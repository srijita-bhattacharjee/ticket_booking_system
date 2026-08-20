import './globals.css';
import Navbar from '../components/Navbar';

export const metadata = {
  title: 'TicketVerse — High-Demand Ticket Booking System',
  description: 'Full-stack ticket booking system for movies and concerts with real-time seat maps, 10-minute hold TTLs, and automated waitlist reallocation.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col bg-[#0b0f19] text-slate-100 antialiased selection:bg-sky-500 selection:text-slate-950">
        <Navbar />
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>
        <footer className="border-t border-slate-800/80 bg-slate-900/40 py-6 text-center text-xs text-slate-500">
          <p>© 2026 TicketVerse System. Powered by NestJS, Next.js, PostgreSQL & Redis.</p>
        </footer>
      </body>
    </html>
  );
}
