"use client";
import Link from "next/link";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";

export default function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, logout } = useAuth();

  const isAuthed = !!user && user.emailVerified;

  


  // STYLES: Matches Desktop "Sign In/Profile" exactly
  // Added 'backdrop-blur-none' to prevent double blur effect on buttons if needed
  const secondaryBtnClass = "bg-transparent text-black hover:bg-[#7C3AED] hover:text-white font-bold btn w-auto block text-center no-underline my-2";
  
  // STYLES: Matches Desktop "Sign Up/Log Out" (assuming global 'btn' class)
  const primaryBtnClass = "btn w-auto block text-center no-underline my-2"; 

  return (
    // NAVBAR CONTAINER
    // Uses bg-white/10 to match your desktop "glass" preference
    <nav className="bg-white/10 backdrop-blur-md border-b border-white/20 sticky top-0 z-50 shadow-md">
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-16 relative">
        
        {/* Left side: Logo + Links */}
        <div className="flex items-center gap-6">
          <Link
            href="/"
            className="text-xl sm:text-2xl font-extrabold tracking-tight text-black transition no-underline"
          >
            BlockTix
          </Link>

          {/* Desktop Links */}
          <div className="hidden md:flex gap-2">
            <Link href="/" className="link">Home</Link>
            <Link href="/discover" className="link">Discover</Link>
            {isAuthed && user.role !== 'user' && (
              <Link href="/dashboard/organizer" className="link">Dashboard</Link>
            )}          
            {isAuthed && <Link href="/dashboard/user" className="link">My Tickets</Link>}
          </div>
        </div>

        {/* Right side: Desktop Buttons */}
        <div className="hidden md:block">
          {isAuthed ? (
            <div>
              <Link href="/profile" className="bg-transparent text-black hover:bg-[#7C3AED] hover:text-white font-bold py-2 px-4 rounded my-2 w-full no-underline transition">Profile</Link>
              <button onClick={logout} className="btn w-auto no-underline m-2">Log Out</button>
            </div>
          ) : (
            <>
              <Link href="/login" className="bg-transparent text-black hover:bg-[#7C3AED] hover:text-white font-bold py-2 px-4 rounded my-2 w-full no-underline transition">Sign In</Link>
              <Link href="/signup" className="btn w-auto no-underline m-2">Sign Up</Link>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <div className="md:hidden">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 rounded-md text-gray-800 hover:bg-black/5 transition"
          >
            {isMobileMenuOpen ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* MOBILE MENU OVERLAY */}
      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 w-full bg-white/70 backdrop-blur-xl border-t border-white/20 shadow-xl">
          <div className="p-4 flex flex-col gap-3">
            
            {/* Mobile Links - styles match desktop font weight/color via 'link' class */}
            <Link href="/" onClick={() => setIsMobileMenuOpen(false)} className="link block py-2 text-center font-medium">Home</Link>
            <Link href="/discover" onClick={() => setIsMobileMenuOpen(false)} className="link block py-2 text-center font-medium">Discover</Link>
            
            {isAuthed && user.role !== 'user' && (
              <Link
                href="/dashboard/organizer"
                onClick={() => setIsMobileMenuOpen(false)}
                className="link block py-2 text-center font-medium"
              >
                Dashboard
              </Link>
            )}            
            {isAuthed && (
              <Link href="/dashboard/user" onClick={() => setIsMobileMenuOpen(false)} className="link block py-2 text-center font-medium">My Tickets</Link>
            )}

            <div className="border-t border-black/10 my-1"></div>

            {/* Mobile Auth Buttons */}
            {isAuthed ? (
              <>
                <Link href='/profile' onClick={() => setIsMobileMenuOpen(false)} className={secondaryBtnClass}>
                  Profile
                </Link>
                <button onClick={() => { logout(); setIsMobileMenuOpen(false); }} className={primaryBtnClass}>
                  Log Out
                </button>
              </>
            ) : (
              <>
                <Link href="/login" onClick={() => setIsMobileMenuOpen(false)} className={secondaryBtnClass}>
                  Sign In
                </Link>
                <Link href="/signup" onClick={() => setIsMobileMenuOpen(false)} className={primaryBtnClass}>
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}