'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

const validateEmail = (email) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email.trim());
};

export default function ResetPage() {
  const { resetPassword } = useAuth();

  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleReset = async (e) => {
  e.preventDefault();
  setError('');
  setMessage('');

  if (!validateEmail(email)) {
    setError('Please enter a valid email address');
    return;
  }

  try {
    const currentUrl =
      typeof window !== 'undefined' ? window.location.href : undefined;

    await resetPassword(email, currentUrl);

    setMessage('If an account exists for this email, a reset link has been sent.');
  } catch (err) {
    console.error('Reset error:', err.code, err.message);

    if (err.code === 'auth/invalid-email') {
      setError('Please enter a valid email address');
    } else if (err.code === 'auth/invalid-continue-uri') {
      setError('Reset link redirect URL is invalid. Check authorized domains.');
    } else {
      setError('Failed to send password reset email');
    }
  }
};


  return (
    <form
      onSubmit={handleReset}
      className="flex flex-col items-center justify-center min-h-screen"
    >
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {message && <p style={{ color: 'green' }}>{message}</p>}

      <div className="w-[400px] h-auto bg-white/20 backdrop-blur-md p-10 rounded-lg">
        <h2 className="font-bold mb-4">Reset Password</h2>

        <label className="label">Email</label>
        <input
          className="input"
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <label className="text-sm">
          Don't have an account? <Link href="/signup">Sign up</Link>
        </label>

        <button
          type="submit"
          className="btn w-[417px] mt-4"
          disabled={loading}
          style={{ opacity: loading ? 0.75 : 1 }}
        >
          {loading ? 'Sending...' : 'Reset Password'}
        </button>
      </div>
    </form>
  );
}
