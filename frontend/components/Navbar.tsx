'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../context/ThemeContext';
import { Ticket, User, LogOut, Shield, LayoutDashboard, Search, Gift, Heart, ShoppingBag, Sun, Moon, Utensils, Tag } from 'lucide-react';

export default function Navbar() {
  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { user, isAuthenticated, logout, isOrganiser, isAdmin } = useAuth();
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <header className="theme-bg-nav theme-border border-b sticky top-0 z-50 transition-colors shadow-md">
      {/* Top Navbar Row */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand Logo & Tagline */}
        <Link href="/" className="flex items-center space-x-2.5 shrink-0">
          <div className="bg-gradient-to-tr from-purple-600 via-pink-500 to-orange-400 p-2 rounded-xl text-white shadow-lg">
            <Ticket className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xl font-black theme-text-main tracking-tight block leading-none">
              TicketVerse
            </span>
            <span className="text-[9px] theme-text-secondary font-medium tracking-wide block mt-0.5">
              Your Ticket to Unforgettable.
            </span>
          </div>
        </Link>

        {/* Search Bar */}
        <div className="hidden md:flex items-center flex-1 max-w-md relative">
          <Search className="w-4 h-4 theme-text-secondary absolute left-3 pointer-events-none" />
          <input
            type="text"
            placeholder="Search for events, movies, artists..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 text-xs rounded-full theme-bg-elevated theme-border border theme-text-main focus:outline-none focus:border-theme-accent transition font-medium"
          />
        </div>

        {/* Right Navigation & Quick Actions */}
        <div className="flex items-center space-x-3 sm:space-x-4" suppressHydrationWarning>
          <Link href="/offers" className="theme-text-secondary hover:theme-text-main transition text-xs font-semibold flex items-center gap-1.5">
            <Gift className="w-4 h-4 text-pink-500" />
            <span className="hidden sm:inline">Offers</span>
          </Link>

          <Link href="/events" className="theme-text-secondary hover:theme-text-main transition text-xs font-semibold flex items-center gap-1.5">
            <Heart className="w-4 h-4 text-purple-400" />
            <span className="hidden sm:inline">Wishlist</span>
          </Link>

          <Link href="/bookings" className="theme-text-secondary hover:theme-text-main transition text-xs font-semibold flex items-center gap-1.5">
            <ShoppingBag className="w-4 h-4 theme-text-accent" />
            <span className="hidden sm:inline">Cart</span>
          </Link>

          {/* Theme Switcher Toggle Button */}
          <button
            onClick={toggleTheme}
            className="p-1.5 rounded-full theme-bg-elevated theme-border border theme-text-main hover:opacity-80 transition flex items-center gap-1 text-xs font-semibold"
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
            aria-label="Toggle Light and Dark Mode"
            suppressHydrationWarning
          >
            {mounted && theme === 'light' ? (
              <Moon className="w-4 h-4 theme-text-accent" />
            ) : (
              <Sun className="w-4 h-4 theme-text-accent" />
            )}
          </button>

          {mounted && isAuthenticated && user ? (
            <div className="flex items-center gap-2 sm:gap-3 border-l theme-border pl-3">
              {isOrganiser && (
                <Link
                  href="/organiser/dashboard"
                  className="theme-bg-elevated theme-text-main hover:opacity-80 theme-border border px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1 transition"
                >
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  <span className="hidden lg:inline">Dashboard</span>
                </Link>
              )}

              {isAdmin && (
                <Link
                  href="/admin/venues"
                  className="theme-bg-elevated theme-text-main hover:opacity-80 theme-border border px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1 transition"
                >
                  <Shield className="w-3.5 h-3.5 theme-text-accent" />
                  <span className="hidden lg:inline">Admin</span>
                </Link>
              )}

              <Link
                href="/account"
                className="flex items-center gap-2 hover:opacity-80 transition text-left"
                title="View Account & Orders"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 p-0.5 shadow-sm">
                  <div className="w-full h-full rounded-full theme-bg-card flex items-center justify-center theme-text-main text-xs font-bold">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                </div>
                <div className="hidden lg:block text-right">
                  <p className="text-xs font-bold theme-text-main leading-tight">{user.name}</p>
                  <span className="text-[9px] uppercase tracking-wider text-pink-400 font-extrabold">
                    {user.role}
                  </span>
                </div>
              </Link>

              <button
                onClick={logout}
                className="p-1.5 theme-text-secondary hover:theme-text-accent rounded-full transition"
                title="Log Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-2 sm:space-x-3">
              <Link
                href="/login"
                className="theme-text-secondary hover:theme-text-main px-3 py-1.5 text-xs font-bold transition"
              >
                Log In
              </Link>
              <Link
                href="/register"
                className="theme-btn-primary font-bold px-4 py-1.5 rounded-full text-xs transition shadow-md"
              >
                Get Started
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Sub-Navigation Categories Bar */}
      <div className="border-t theme-border py-2 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto flex items-center justify-center gap-4 sm:gap-6 overflow-x-auto text-xs font-bold theme-text-secondary">
        <Link href="/events?type=MOVIE" className="hover:theme-text-main transition px-3 py-0.5 rounded-full hover:theme-bg-elevated whitespace-nowrap">
          Movies
        </Link>
        <Link href="/events?type=CONCERT" className="hover:theme-text-main transition px-3 py-0.5 rounded-full hover:theme-bg-elevated whitespace-nowrap">
          Concerts
        </Link>
        <Link href="/events" className="hover:theme-text-main transition px-3 py-0.5 rounded-full hover:theme-bg-elevated whitespace-nowrap">
          All Events
        </Link>
        <Link href="/events?type=THEATRE" className="hover:theme-text-main transition px-3 py-0.5 rounded-full hover:theme-bg-elevated whitespace-nowrap">
          Plays
        </Link>
        <Link href="/events?type=SPORTS" className="hover:theme-text-main transition px-3 py-0.5 rounded-full hover:theme-bg-elevated whitespace-nowrap">
          Sports
        </Link>
        <Link href="/events?type=COMEDY" className="hover:theme-text-main transition px-3 py-0.5 rounded-full hover:theme-bg-elevated whitespace-nowrap">
          Comedy
        </Link>
        <Link href="/events?type=WORKSHOP" className="hover:theme-text-main transition px-3 py-0.5 rounded-full hover:theme-bg-elevated whitespace-nowrap">
          Workshops
        </Link>
      </div>
    </header>
  );
}
