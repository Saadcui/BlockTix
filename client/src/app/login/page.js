'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) && email.trim().endsWith('.com');

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [emailError, setEmailError] = useState('');

  const validateEmail = (val) => (!val.trim() ? '' : isValidEmail(val) ? '' : 'Please enter a valid email');

  const handleLogin = async (e) => {
  e.preventDefault();
  setError('');
  const eErr = validateEmail(email);
  if (eErr) {
    setEmailError(eErr);
    return;
  }
  setEmailError('');

  try {
  const { role } = await login(email, password);
  router.push(`/dashboard/${role}`);
} catch (err) {
  console.error("Login error:", err.code, err.message);

  if (err.message === "EMAIL_NOT_VERIFIED") {
    setError("Please verify your email first. Check your inbox (and spam).");
  } else if (
    err.code === "auth/invalid-credential" ||
    err.code === "auth/invalid-login-credentials"
  ) {
    setError("Email or password is incorrect.");
  } else {
    setError("Unexpected error. Please try again.");
  }
}
};



  return (
    <form onSubmit={handleLogin} className='flex flex-col items-center justify-center min-h-screen'>
      {error && <p style={{ color: 'red' }}>{error}</p>}

      <div className='w-[400px] h-[auto] bg-white/20 backdrop-blur-md p-10 rounded-lg'>
        <h2 className='font-bold mb-4'>Login</h2>

        <label className='label'>Email</label>
        <input
          className={`input ${emailError ? 'border-red-500' : ''}`}
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          onBlur={() => setEmailError(validateEmail(email))}
          onFocus={() => setEmailError('')}
          required
        />
        {emailError && <p className="text-red-500 text-sm mt-1">{emailError}</p>}

        <label className='label'>Password</label>
        <input
          className='input'
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
        />

        <label className='text-sm'>Don't have an account? <Link href="/signup">Sign up</Link></label>
        <br />
        <label className='text-sm color-[#7C3AED]'><Link href="/resetPassword">Forgot Password?</Link></label>

        <button type="submit" className='btn w-[417px]'>Log In</button>
      </div>
    </form>
  );
}
