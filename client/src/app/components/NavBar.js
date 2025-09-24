"use client";
import Link from "next/link";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import ThemeToggle from "./ThemeToggle";

export default function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user , logout } = useAuth();

  return (
<nav className="glass border-b border-gray-200/20 dark:border-gray-700/30 sticky top-0 z-50 shadow-md">
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-16">
        
        {/* Left side: Logo + Links */}
        <div className="flex items-center gap-6">
          {/* Logo */}
          <Link
            href="/"
            className="text-xl sm:text-2xl font-extrabold tracking-tight text-gray-900 dark:text-gray-100 transition-colors duration-300 no-underline"
          >
            BlockTix
          </Link>

          {/* Links */}
          <div className="hidden md:flex gap-2">
            <Link href="/" className="link">Home</Link>
            <Link href="/discover" className="link">Discover</Link>
            <Link href="/dashboard/organizer" className="link">Dashboard</Link>
            <Link href="/dashboard/user" className="link">My Tickets</Link>
          </div>
        </div>

        {/* Right side: Theme Toggle + Auth */}
        <div className="hidden md:flex items-center gap-4">
          <ThemeToggle />
          { user ? (
              <div className="flex items-center gap-2">
                <Link href="/profile" className="bg-transparent text-gray-900 dark:text-gray-100 hover:bg-primary-500 hover:text-white font-bold py-2 px-4 rounded transition-colors duration-300 no-underline">Profile</Link>
                <button onClick={logout} className="btn w-auto no-underline m-2">Log Out</button>
              </div>
          ) : ( 
          <>
          <Link href="/login" className="bg-transparent text-gray-900 dark:text-gray-100 hover:bg-primary-500 hover:text-white font-bold py-2 px-4 rounded transition-colors duration-300 no-underline">Sign In</Link>
          <Link href="/signup" className="btn w-auto no-underline m-2">Sign Up</Link>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <div className="md:hidden flex items-center gap-2">
          <ThemeToggle />
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 rounded-md text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-300"
          >
            {isMobileMenuOpen ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16"/>
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-md">
          <div className="p-4 flex flex-col gap-2">
            <Link href="/" onClick={() => setIsMobileMenuOpen(false)} className="link">Home</Link>
            <Link href="/discover" onClick={() => setIsMobileMenuOpen(false)} className="link">Discover</Link>
            <Link href="/dashboard/organizer" onClick={() => setIsMobileMenuOpen(false)} className="link">Dashboard</Link>
            <Link href="/dashboard/user" onClick={() => setIsMobileMenuOpen(false)} className="link">My Tickets</Link>
            <div className="flex gap-2 mt-2">
              <Link href="/login" onClick={() => setIsMobileMenuOpen(false)} className="btn no-underline">Sign In</Link>
              <Link href="/signup" onClick={() => setIsMobileMenuOpen(false)} className="btn no-underline">Sign Up</Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
