"use client"
import Link from "next/link"
import { useState } from "react"

export default function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  return (
    <nav style={{
      backgroundColor: 'white',
      borderBottom: '1px solid #e5e7eb',
      position: 'sticky',
      top: 0,
      zIndex: 50,
      boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)'
    }}>
      <div style={{
        maxWidth: '1280px',
        margin: '0 auto',
        padding: '0 16px'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          height: '64px'
        }}>
          {/* Left side - Logo and Navigation Links */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '32px'
          }}>
            {/* Logo */}
            <div>
              <Link href="/" style={{
                fontSize: '24px',
                fontWeight: 'bold',
                color: '#111827',
                textDecoration: 'none',
                transition: 'color 0.2s'
              }}
              onMouseEnter={(e) => e.target.style.color = '#2563eb'}
              onMouseLeave={(e) => e.target.style.color = '#111827'}
              >
                BlockTix
              </Link>
            </div>
            {/* Navigation Links - Desktop */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }} className="hidden md:flex">
              <Link
                href="/"
                style={{
                  color: '#111827',
                  padding: '12px 20px',
                  borderRadius: '12px',
                  fontSize: '16px',
                  fontWeight: '600',
                  textDecoration: 'none',
                  transition: 'all 0.2s',
                  border: '1px solid transparent',
                  position: 'relative'
                }}
                onMouseEnter={(e) => {
                  e.target.style.color = '#374151'
                  e.target.style.backgroundColor = '#f3f4f6'
                  e.target.style.border = '1px solid #e5e7eb'
                  e.target.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.05)'
                }}
                onMouseLeave={(e) => {
                  e.target.style.color = '#111827'
                  e.target.style.backgroundColor = 'transparent'
                  e.target.style.border = '1px solid transparent'
                  e.target.style.boxShadow = 'none'
                }}
              >
                Home
              </Link>
              <Link
                href="/discover"
                style={{
                  color: 'gray',
                  padding: '12px 20px',
                  borderRadius: '12px',
                  fontSize: '18px',
                  fontWeight: '600',
                  textDecoration: 'none',
                  transition: 'all 0.2s',
                  border: '1px solid transparent',
                  position: 'relative'
                }}
                onMouseEnter={(e) => {
                  e.target.style.color = '#374151'
                  e.target.style.backgroundColor = '#f3f4f6'
                  e.target.style.border = '1px solid #e5e7eb'
                  e.target.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.05)'
                }}
                onMouseLeave={(e) => {
                  e.target.style.color = '#374151'
                  e.target.style.backgroundColor = 'transparent'
                  e.target.style.border = '1px solid transparent'
                  e.target.style.boxShadow = 'none'
                }}
              >
                Discover
              </Link>
              <Link
                href="/dashboard"
                style={{
                  color: '#374151',
                  padding: '12px 20px',
                  borderRadius: '12px',
                  fontSize: '16px',
                  fontWeight: '600',
                  textDecoration: 'none',
                  transition: 'all 0.2s',
                  border: '1px solid transparent',
                  position: 'relative'
                }}
                onMouseEnter={(e) => {
                  e.target.style.color = '#374151'
                  e.target.style.backgroundColor = '#f3f4f6'
                  e.target.style.border = '1px solid #e5e7eb'
                  e.target.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.05)'
                }}
                onMouseLeave={(e) => {
                  e.target.style.color = '#374151'
                  e.target.style.backgroundColor = 'transparent'
                  e.target.style.border = '1px solid transparent'
                  e.target.style.boxShadow = 'none'
                }}
              >
                Dashboard
              </Link>
              <Link
                href="/my-tickets"
                style={{
                  color: '#374151',
                  padding: '12px 20px',
                  borderRadius: '12px',
                  fontSize: '16px',
                  fontWeight: '600',
                  textDecoration: 'none',
                  transition: 'all 0.2s',
                  border: '1px solid transparent',
                  position: 'relative'
                }}
                onMouseEnter={(e) => {
                  e.target.style.color = '#374151'
                  e.target.style.backgroundColor = '#f3f4f6'
                  e.target.style.border = '1px solid #e5e7eb'
                  e.target.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.05)'
                }}
                onMouseLeave={(e) => {
                  e.target.style.color = '#374151'
                  e.target.style.backgroundColor = 'transparent'
                  e.target.style.border = '1px solid transparent'
                  e.target.style.boxShadow = 'none'
                }}
              >
                MyTickets
              </Link>
            </div>
          </div>
          {/* Right side - Sign In Button */}
          <div className="hidden md:block">
            <Link 
              href="/signin"
              style={{
                backgroundColor: '#2563eb',
                color: 'white',
                padding: '12px 28px',
                borderRadius: '12px',
                fontSize: '16px',
                fontWeight: '600',
                textDecoration: 'none',
                transition: 'all 0.2s',
                boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                display: 'inline-block',
                border: '1px solid transparent'
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = '#1d4ed8'
                e.target.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                e.target.style.transform = 'translateY(-1px)'
                e.target.style.border = '1px solid rgba(0, 0, 0, 0.05)'
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = '#2563eb'
                e.target.style.boxShadow = '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
                e.target.style.transform = 'translateY(0)'
                e.target.style.border = '1px solid transparent'
              }}
            >
              Sign In
            </Link>
          </div>
          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              style={{
                backgroundColor: 'white',
                padding: '8px',
                borderRadius: '8px',
                color: '#9ca3af',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.target.style.color = '#4b5563'
                e.target.style.backgroundColor = '#f3f4f6'
              }}
              onMouseLeave={(e) => {
                e.target.style.color = '#9ca3af'
                e.target.style.backgroundColor = 'white'
              }}
            >
              {/* Hamburger icon */}
              <svg
                style={{
                  width: '24px',
                  height: '24px',
                  display: isMobileMenuOpen ? 'none' : 'block'
                }}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
              {/* Close icon */}
              <svg
                style={{
                  width: '24px',
                  height: '24px',
                  display: isMobileMenuOpen ? 'block' : 'none'
                }}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
      {/* Mobile menu */}
      <div 
        style={{
          maxHeight: isMobileMenuOpen ? '400px' : '0',
          opacity: isMobileMenuOpen ? '1' : '0',
          overflow: 'hidden',
          transition: 'all 0.3s ease-in-out'
        }}
        className="md:hidden"
      >
        <div style={{
          padding: '16px',
          backgroundColor: 'white',
          borderTop: '1px solid #e5e7eb',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
        }}>
          <div style={{ marginBottom: '8px' }}>
            <Link
              href="/"
              onClick={() => setIsMobileMenuOpen(false)}
              style={{
                color: '#111827',
                padding: '16px 20px',
                borderRadius: '12px',
                fontSize: '16px',
                fontWeight: '600',
                textDecoration: 'none',
                display: 'block',
                transition: 'all 0.2s',
                border: '1px solid transparent'
              }}
              onMouseEnter={(e) => {
                e.target.style.color = '#374151'
                e.target.style.backgroundColor = '#f3f4f6'
                e.target.style.border = '1px solid #e5e7eb'
                e.target.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.05)'
              }}
              onMouseLeave={(e) => {
                e.target.style.color = '#111827'
                e.target.style.backgroundColor = 'transparent'
                e.target.style.border = '1px solid transparent'
                e.target.style.boxShadow = 'none'
              }}
            >
              Home
            </Link>
          </div>
          <div style={{ marginBottom: '8px' }}>
            <Link
              href="/discover"
              onClick={() => setIsMobileMenuOpen(false)}
              style={{
                color: '#374151',
                padding: '16px 20px',
                borderRadius: '12px',
                fontSize: '16px',
                fontWeight: '600',
                textDecoration: 'none',
                display: 'block',
                transition: 'all 0.2s',
                border: '1px solid transparent'
              }}
              onMouseEnter={(e) => {
                e.target.style.color = '#374151'
                e.target.style.backgroundColor = '#f3f4f6'
                e.target.style.border = '1px solid #e5e7eb'
                e.target.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.05)'
              }}
              onMouseLeave={(e) => {
                e.target.style.color = '#374151'
                e.target.style.backgroundColor = 'transparent'
                e.target.style.border = '1px solid transparent'
                e.target.style.boxShadow = 'none'
              }}
            >
              Discover
            </Link>
          </div>
          <div style={{ marginBottom: '8px' }}>
            <Link
              href="/dashboard"
              onClick={() => setIsMobileMenuOpen(false)}
              style={{
                color: '#374151',
                padding: '16px 20px',
                borderRadius: '12px',
                fontSize: '16px',
                fontWeight: '600',
                textDecoration: 'none',
                display: 'block',
                transition: 'all 0.2s',
                border: '1px solid transparent'
              }}
              onMouseEnter={(e) => {
                e.target.style.color = '#374151'
                e.target.style.backgroundColor = '#f3f4f6'
                e.target.style.border = '1px solid #e5e7eb'
                e.target.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.05)'
              }}
              onMouseLeave={(e) => {
                e.target.style.color = '#374151'
                e.target.style.backgroundColor = 'transparent'
                e.target.style.border = '1px solid transparent'
                e.target.style.boxShadow = 'none'
              }}
            >
              Dashboard
            </Link>
          </div>
          <div style={{ marginBottom: '16px' }}>
            <Link
              href="/my-tickets"
              onClick={() => setIsMobileMenuOpen(false)}
              style={{
                color: '#374151',
                padding: '16px 20px',
                borderRadius: '12px',
                fontSize: '16px',
                fontWeight: '600',
                textDecoration: 'none',
                display: 'block',
                transition: 'all 0.2s',
                border: '1px solid transparent'
              }}
              onMouseEnter={(e) => {
                e.target.style.color = '#374151'
                e.target.style.backgroundColor = '#f3f4f6'
                e.target.style.border = '1px solid #e5e7eb'
                e.target.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.05)'
              }}
              onMouseLeave={(e) => {
                e.target.style.color = '#374151'
                e.target.style.backgroundColor = 'transparent'
                e.target.style.border = '1px solid transparent'
                e.target.style.boxShadow = 'none'
              }}
            >
              MyTickets
            </Link>
          </div>
          <div style={{
            paddingTop: '16px',
            borderTop: '1px solid #e5e7eb'
          }}>
            <Link 
              href="/signin" 
              onClick={() => setIsMobileMenuOpen(false)}
              style={{
                width: '100%',
                backgroundColor: '#2563eb',
                color: 'white',
                padding: '16px 20px',
                borderRadius: '12px',
                fontSize: '16px',
                fontWeight: '600',
                textDecoration: 'none',
                display: 'block',
                textAlign: 'center',
                transition: 'all 0.2s',
                boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                border: '1px solid transparent'
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = '#1d4ed8'
                e.target.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = '#2563eb'
                e.target.style.boxShadow = '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
              }}
            >
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </nav>
  )
}