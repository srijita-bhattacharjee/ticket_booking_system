import './globals.css';
import Navbar from '../components/Navbar';
import CursorGlow from '../components/CursorGlow';
import MarqueeBanner from '../components/MarqueeBanner';
import ChatbotWidget from '../components/ChatbotWidget';
import { AuthProvider } from '../context/AuthContext';
import { ThemeProvider } from '../context/ThemeContext';

export const metadata = {
  title: 'TicketVerse — High-Demand Live Ticket Booking Engine',
  description: 'Full-stack ticket booking system for movies and concerts with real-time seat maps, 10-minute hold TTLs, and automated waitlist reallocation.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <body className="min-h-screen flex flex-col antialiased selection:bg-[#FF6847] selection:text-white relative" suppressHydrationWarning>
        <CursorGlow />
        <ThemeProvider>
          <AuthProvider>
            <MarqueeBanner direction="left" />
            <Navbar />
            <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
              {children}
            </main>
            <MarqueeBanner direction="right" />
            <footer className="border-t theme-border theme-bg-nav py-6 text-center text-xs theme-text-secondary transition-colors relative z-10">
              <p>© 2026 TicketVerse Engine. Powered by NestJS, Next.js, PostgreSQL & Redis.</p>
            </footer>
            <ChatbotWidget />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
