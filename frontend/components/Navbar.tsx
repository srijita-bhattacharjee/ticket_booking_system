'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../context/ThemeContext';
import { Ticket, LogOut, Shield, LayoutDashboard, Gift, Heart, Sun, Moon, Search, X, Menu } from 'lucide-react';

export default function Navbar() {
  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchExpanded, setSearchExpanded] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const mobileSearchRef = useRef<HTMLInputElement>(null);
  const { user, isAuthenticated, logout, isOrganiser, isAdmin } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const q = searchQuery.trim();
    if (q) {
      router.push(`/events?search=${encodeURIComponent(q)}`);
      setSearchExpanded(false);
      setMobileSearchOpen(false);
      setMobileMenuOpen(false);
      setSearchQuery('');
    }
  };

  const handleSearchToggle = () => {
    setSearchExpanded(true);
    setTimeout(() => searchInputRef.current?.focus(), 50);
  };

  const handleSearchBlur = () => {
    if (!searchQuery.trim()) setSearchExpanded(false);
  };

  const handleMobileSearch = () => {
    setMobileSearchOpen(true);
    setTimeout(() => mobileSearchRef.current?.focus(), 50);
  };

  return (
    <header className="theme-bg-nav theme-border border-b sticky top-0 z-50 transition-colors shadow-md">
      {/* Top Navbar Row */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-2 sm:gap-4">

        {/* Brand Logo */}
        <Link href="/" className="flex items-center space-x-2 shrink-0">
          <div className="bg-gradient-to-tr from-purple-600 via-pink-500 to-orange-400 p-1.5 sm:p-2 rounded-xl text-white shadow-lg">
            <Ticket className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div>
            <span className="text-base sm:text-xl font-black theme-text-main tracking-tight block leading-none">
              TicketVerse
            </span>
            <span className="text-[8px] sm:text-[9px] theme-text-secondary font-medium tracking-wide block mt-0.5 hidden sm:block">
              Your Ticket to Unforgettable.
            </span>
          </div>
        </Link>

        {/* Desktop Search Bar — hidden on mobile */}
        <form
          onSubmit={handleSearch}
          className="flex-1 max-w-md mx-4 hidden sm:flex items-center"
        >
          <div className={`relative flex items-center w-full rounded-full border transition-all duration-300 ${
            searchExpanded
              ? 'theme-bg-elevated theme-border shadow-lg ring-1 ring-purple-500/40'
              : 'theme-bg-elevated theme-border'
          }`}>
            <button
              type="button"
              onClick={handleSearchToggle}
              className="pl-3 pr-2 theme-text-secondary hover:theme-text-main transition"
              tabIndex={-1}
              aria-label="Search"
            >
              <Search className="w-4 h-4" />
            </button>
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setSearchExpanded(true)}
              onBlur={handleSearchBlur}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Search events, venues, artists..."
              className="flex-1 bg-transparent py-2 pr-2 text-xs theme-text-main placeholder:theme-text-secondary outline-none min-w-0"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => { setSearchQuery(''); searchInputRef.current?.focus(); }}
                className="pr-3 theme-text-secondary hover:theme-text-main transition"
                aria-label="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </form>

        {/* Right Nav — Desktop */}
        <div className="hidden sm:flex items-center space-x-3 sm:space-x-4 shrink-0" suppressHydrationWarning>
          <Link href="/offers" className="theme-text-secondary hover:theme-text-main transition text-xs font-semibold flex items-center gap-1.5">
            <Gift className="w-4 h-4 text-pink-500" />
            <span className="hidden lg:inline">Offers</span>
          </Link>

          <Link href="/events" className="theme-text-secondary hover:theme-text-main transition text-xs font-semibold flex items-center gap-1.5">
            <Heart className="w-4 h-4 text-purple-400" />
            <span className="hidden lg:inline">Wishlist</span>
          </Link>

          <Link href="/bookings" className="theme-text-secondary hover:theme-text-main transition text-xs font-semibold flex items-center gap-1.5">
            <Ticket className="w-4 h-4 theme-text-accent" />
            <span className="hidden lg:inline">My Bookings</span>
          </Link>

          <button
            onClick={toggleTheme}
            className="p-1.5 rounded-full theme-bg-elevated theme-border border theme-text-main hover:opacity-80 transition"
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
            aria-label="Toggle theme"
            suppressHydrationWarning
          >
            {mounted && theme === 'light' ? (
              <Moon className="w-4 h-4 theme-text-accent" />
            ) : (
              <Sun className="w-4 h-4 theme-text-accent" />
            )}
          </button>

          {mounted && isAuthenticated && user ? (
            <div className="flex items-center gap-2 border-l theme-border pl-3">
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
              <Link href="/account" className="flex items-center gap-2 hover:opacity-80 transition" title="Account">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 p-0.5 shadow-sm">
                  <div className="w-full h-full rounded-full theme-bg-card flex items-center justify-center theme-text-main text-xs font-bold">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                </div>
                <div className="hidden lg:block">
                  <p className="text-xs font-bold theme-text-main leading-tight">{user.name}</p>
                  <span className="text-[9px] uppercase tracking-wider text-pink-400 font-extrabold">{user.role}</span>
                </div>
              </Link>
              <button onClick={logout} className="p-1.5 theme-text-secondary hover:theme-text-accent rounded-full transition" title="Log Out">
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <Link href="/login" className="theme-text-secondary hover:theme-text-main px-3 py-1.5 text-xs font-bold transition">
                Log In
              </Link>
              <Link href="/register" className="theme-btn-primary font-bold px-4 py-1.5 rounded-full text-xs transition shadow-md">
                Get Started
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Right — Search + Theme + Hamburger only */}
        <div className="flex sm:hidden items-center gap-2" suppressHydrationWarning>
          {/* Mobile Search Icon */}
          <button
            onClick={handleMobileSearch}
            className="p-1.5 theme-text-secondary hover:theme-text-main transition"
            aria-label="Search"
          >
            <Search className="w-5 h-5" />
          </button>

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="p-1.5 rounded-full theme-bg-elevated theme-border border theme-text-main hover:opacity-80 transition"
            aria-label="Toggle theme"
            suppressHydrationWarning
          >
            {mounted && theme === 'light' ? (
              <Moon className="w-4 h-4 theme-text-accent" />
            ) : (
              <Sun className="w-4 h-4 theme-text-accent" />
            )}
          </button>

          {/* Hamburger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1.5 theme-text-secondary hover:theme-text-main transition"
            aria-label="Open menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Search Bar — slides in when open */}
      {mobileSearchOpen && (
        <div className="sm:hidden px-4 pb-3 pt-1 border-t theme-border">
          <form onSubmit={handleSearch} className="flex items-center gap-2">
            <div className="flex-1 flex items-center theme-bg-elevated theme-border border rounded-full px-3 py-2 ring-1 ring-purple-500/40">
              <Search className="w-4 h-4 theme-text-secondary shrink-0 mr-2" />
              <input
                ref={mobileSearchRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Search events, venues, artists..."
                className="flex-1 bg-transparent text-xs theme-text-main placeholder:theme-text-secondary outline-none"
              />
              {searchQuery && (
                <button type="button" onClick={() => setSearchQuery('')} className="theme-text-secondary hover:theme-text-main ml-1">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <button
              type="button"
              onClick={() => { setMobileSearchOpen(false); setSearchQuery(''); }}
              className="text-xs theme-text-secondary font-semibold"
            >
              Cancel
            </button>
          </form>
        </div>
      )}

      {/* Mobile Dropdown Menu */}
      {mobileMenuOpen && (
        <div className="sm:hidden border-t theme-border theme-bg-nav px-4 py-4 space-y-1">
          {mounted && isAuthenticated && user ? (
            <>
              <div className="flex items-center gap-3 pb-3 mb-3 border-b theme-border">
                <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 p-0.5 shadow-sm shrink-0">
                  <div className="w-full h-full rounded-full theme-bg-card flex items-center justify-center theme-text-main text-xs font-bold">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-bold theme-text-main">{user.name}</p>
                  <span className="text-[10px] uppercase tracking-wider text-pink-400 font-extrabold">{user.role}</span>
                </div>
              </div>
              <MobileLink href="/events" onClick={() => setMobileMenuOpen(false)}>🎟 All Events</MobileLink>
              <MobileLink href="/offers" onClick={() => setMobileMenuOpen(false)}>🎁 Offers</MobileLink>
              <MobileLink href="/bookings" onClick={() => setMobileMenuOpen(false)}>📋 My Bookings</MobileLink>
              <MobileLink href="/account" onClick={() => setMobileMenuOpen(false)}>👤 Account</MobileLink>
              {isOrganiser && <MobileLink href="/organiser/dashboard" onClick={() => setMobileMenuOpen(false)}>📊 Dashboard</MobileLink>}
              {isAdmin && <MobileLink href="/admin/venues" onClick={() => setMobileMenuOpen(false)}>🛡 Admin Panel</MobileLink>}
              <button
                onClick={() => { logout(); setMobileMenuOpen(false); }}
                className="w-full text-left px-3 py-2.5 rounded-xl text-sm font-semibold text-red-400 hover:bg-red-500/10 transition"
              >
                🚪 Log Out
              </button>
            </>
          ) : (
            <>
              <MobileLink href="/events" onClick={() => setMobileMenuOpen(false)}>🎟 All Events</MobileLink>
              <MobileLink href="/offers" onClick={() => setMobileMenuOpen(false)}>🎁 Offers</MobileLink>
              <div className="pt-3 flex flex-col gap-2">
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-2.5 rounded-xl text-sm font-bold theme-text-main theme-bg-elevated theme-border border transition"
                >
                  Log In
                </Link>
                <Link
                  href="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center theme-btn-primary font-bold py-2.5 rounded-xl text-sm transition shadow-md"
                >
                  Get Started
                </Link>
              </div>
            </>
          )}
        </div>
      )}

      {/* Sub-Navigation Categories Bar */}
      <div className="border-t theme-border py-2 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto flex items-center gap-3 sm:gap-6 overflow-x-auto text-xs font-bold theme-text-secondary scrollbar-hide">
        <Link href="/events?type=MOVIE" className="hover:theme-text-main transition px-2.5 sm:px-3 py-0.5 rounded-full hover:theme-bg-elevated whitespace-nowrap">Movies</Link>
        <Link href="/events?type=CONCERT" className="hover:theme-text-main transition px-2.5 sm:px-3 py-0.5 rounded-full hover:theme-bg-elevated whitespace-nowrap">Concerts</Link>
        <Link href="/events" className="hover:theme-text-main transition px-2.5 sm:px-3 py-0.5 rounded-full hover:theme-bg-elevated whitespace-nowrap">All Events</Link>
        <Link href="/events?type=THEATRE" className="hover:theme-text-main transition px-2.5 sm:px-3 py-0.5 rounded-full hover:theme-bg-elevated whitespace-nowrap">Plays</Link>
        <Link href="/events?type=SPORTS" className="hover:theme-text-main transition px-2.5 sm:px-3 py-0.5 rounded-full hover:theme-bg-elevated whitespace-nowrap">Sports</Link>
        <Link href="/events?type=COMEDY" className="hover:theme-text-main transition px-2.5 sm:px-3 py-0.5 rounded-full hover:theme-bg-elevated whitespace-nowrap">Comedy</Link>
        <Link href="/events?type=WORKSHOP" className="hover:theme-text-main transition px-2.5 sm:px-3 py-0.5 rounded-full hover:theme-bg-elevated whitespace-nowrap">Workshops</Link>
      </div>
    </header>
  );
}

function MobileLink({ href, onClick, children }: { href: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="block px-3 py-2.5 rounded-xl text-sm font-semibold theme-text-main hover:theme-bg-elevated transition"
    >
      {children}
    </Link>
  );
}
