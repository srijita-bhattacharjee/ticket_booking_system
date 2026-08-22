'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../context/ThemeContext';
import { Ticket, User, LogOut, Shield, LayoutDashboard, Compass, Utensils, Tag, Sun, Moon } from 'lucide-react';

export default function Navbar() {
  const [mounted, setMounted] = useState(false);
  const { user, isAuthenticated, logout, isOrganiser, isAdmin } = useAuth();
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <nav className="border-b theme-bg-nav theme-border sticky top-0 z-50 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center space-x-2">
          <div className="theme-btn-primary p-2 rounded-xl font-bold shadow-md">
            <Ticket className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold theme-text-main">
            TicketVerse
          </span>
        </Link>

        <div className="flex items-center space-x-3 sm:space-x-4" suppressHydrationWarning>
          <Link href="/events" className="theme-text-secondary hover:theme-text-main transition text-xs sm:text-sm flex items-center gap-1 font-medium">
            <Compass className="w-4 h-4" />
            Events
          </Link>
          <Link href="/offers" className="theme-text-secondary hover:theme-text-main transition text-xs sm:text-sm flex items-center gap-1 font-medium">
            <Tag className="w-4 h-4 theme-text-accent" />
            Offers
          </Link>

          {/* Theme Switcher Toggle Button */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl theme-bg-card theme-border border theme-text-main hover:opacity-80 transition flex items-center gap-1 text-xs font-semibold"
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
            aria-label="Toggle Light and Dark Mode"
            suppressHydrationWarning
          >
            {mounted && theme === 'light' ? (
              <>
                <Moon className="w-4 h-4 theme-text-accent" />
                <span className="hidden sm:inline text-[11px] theme-text-secondary font-bold">Dark</span>
              </>
            ) : (
              <>
                <Sun className="w-4 h-4 theme-text-accent" />
                <span className="hidden sm:inline text-[11px] theme-text-secondary font-bold">Light</span>
              </>
            )}
          </button>

          {mounted && isAuthenticated && user ? (
            <>
              <Link href="/bookings" className="theme-text-secondary hover:theme-text-main transition text-xs sm:text-sm font-medium hidden sm:inline-block">
                My Bookings
              </Link>

              {isOrganiser && (
                <>
                  <Link
                    href="/organiser/dashboard"
                    className="theme-bg-card theme-text-main hover:opacity-80 theme-border border px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1 transition"
                  >
                    <LayoutDashboard className="w-3.5 h-3.5" />
                    Dashboard
                  </Link>
                  <Link
                    href="/organiser/coupons"
                    className="theme-bg-card theme-text-main hover:opacity-80 theme-border border px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1 transition hidden md:flex"
                  >
                    <Tag className="w-3.5 h-3.5 theme-text-accent" />
                    Coupons
                  </Link>
                </>
              )}

              {isAdmin && (
                <>
                  <Link
                    href="/admin/venues"
                    className="theme-bg-card theme-text-main hover:opacity-80 theme-border border px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1 transition"
                  >
                    <Shield className="w-3.5 h-3.5 theme-text-accent" />
                    Venues
                  </Link>
                  <Link
                    href="/admin/food"
                    className="theme-bg-card theme-text-main hover:opacity-80 theme-border border px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1 transition hidden md:flex"
                  >
                    <Utensils className="w-3.5 h-3.5 theme-text-accent" />
                    Food Stalls
                  </Link>
                </>
              )}

              <div className="flex items-center gap-2 sm:gap-3 border-l theme-border pl-3">
                <Link
                  href="/account"
                  className="flex items-center gap-2 hover:opacity-80 transition text-left group"
                  title="View Account Details & Past Orders"
                >
                  <div className="w-8 h-8 rounded-full theme-bg-card theme-border border flex items-center justify-center theme-text-accent transition">
                    <User className="w-4 h-4" />
                  </div>
                  <div className="hidden lg:block text-right">
                    <p className="text-xs font-semibold theme-text-main transition">{user.name}</p>
                    <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded theme-bg-elevated theme-text-accent theme-border border font-bold">
                      {user.role}
                    </span>
                  </div>
                </Link>

                <button
                  onClick={logout}
                  className="p-2 theme-text-secondary hover:theme-text-accent rounded-lg transition"
                  title="Log Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </>
          ) : (
            <div className="flex items-center space-x-2 sm:space-x-3">
              <Link
                href="/login"
                className="theme-text-secondary hover:theme-text-main px-3 py-1.5 text-xs sm:text-sm font-medium transition"
              >
                Log In
              </Link>
              <Link
                href="/register"
                className="theme-btn-primary font-semibold px-4 py-1.5 rounded-lg text-xs sm:text-sm transition shadow-md"
              >
                Get Started
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
