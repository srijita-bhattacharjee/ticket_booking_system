'use client';

import Link from 'next/link';
import { useAuth } from '../hooks/useAuth';
import { Ticket, User, LogOut, Shield, LayoutDashboard, Compass } from 'lucide-react';

export default function Navbar() {
  const { user, isAuthenticated, logout, isOrganiser, isAdmin } = useAuth();

  return (
    <nav className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center space-x-2">
          <div className="bg-gradient-to-tr from-sky-400 to-indigo-500 p-2 rounded-xl text-slate-950 font-bold shadow-lg shadow-sky-500/20">
            <Ticket className="w-5 h-5" />
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-sky-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">
            TicketVerse
          </span>
        </Link>

        <div className="flex items-center space-x-6">
          <Link href="/events" className="text-slate-300 hover:text-sky-400 transition text-sm flex items-center gap-1 font-medium">
            <Compass className="w-4 h-4" />
            Explore Events
          </Link>

          {isAuthenticated ? (
            <>
              <Link href="/bookings" className="text-slate-300 hover:text-sky-400 transition text-sm font-medium">
                My Bookings
              </Link>

              {isOrganiser && (
                <Link
                  href="/organiser/dashboard"
                  className="bg-purple-900/40 text-purple-300 hover:bg-purple-900/60 border border-purple-700/50 px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1.5 transition"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  Organiser Hub
                </Link>
              )}

              {isAdmin && (
                <Link
                  href="/admin/venues"
                  className="bg-amber-900/40 text-amber-300 hover:bg-amber-900/60 border border-amber-700/50 px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1.5 transition"
                >
                  <Shield className="w-4 h-4" />
                  Admin Venues
                </Link>
              )}

              <div className="flex items-center gap-3 border-l border-slate-800 pl-4">
                <div className="text-right">
                  <p className="text-xs font-semibold text-slate-200">{user.name}</p>
                  <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-800 text-sky-400 border border-slate-700">
                    {user.role}
                  </span>
                </div>
                <button
                  onClick={logout}
                  className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition"
                  title="Log Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </>
          ) : (
            <div className="flex items-center space-x-3">
              <Link
                href="/login"
                className="text-slate-300 hover:text-white px-3 py-1.5 text-sm font-medium transition"
              >
                Log In
              </Link>
              <Link
                href="/register"
                className="bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold px-4 py-1.5 rounded-lg text-sm transition shadow-lg shadow-sky-500/20"
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
