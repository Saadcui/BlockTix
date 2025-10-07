'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

// Validation helper - must end with .com
const isValidEmail = (email) => {
  const trimmed = email.trim();
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(trimmed) && trimmed.endsWith('.com');
};

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  
  // Validation state
  const [emailError, setEmailError] = useState('');

  const validateEmailField = (val) => {
    if (!val.trim()) return '';
    return isValidEmail(val) ? '' : 'Please enter a valid email';
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    // Validate email before submission
    const eErr = validateEmailField(email);
    setEmailError(eErr);
    
    if (eErr) return;

    try {
      const { role } = await login(email, password);
      router.push(`/dashboard/${role}`);
    } catch (err) {
      console.error(err);
      setError("Account not found!");
    }
  };

  return (
    <form onSubmit={handleLogin} className='flex flex-col items-center justify-center min-h-screen'>
      {error && <p style={{ color: 'red' }}>{error}</p>}

      <div className='w-[400px] h-[auto] bg-white/20 backdrop-blur-md p-10 rounded-lg'>
        <h2 className='font-bold mb-4'>Login</h2>
        
        {/* Email */}
        <div>
          <label htmlFor="email" className='label'>Email</label>
          <input
            id="email"
            className={`input ${emailError ? 'border-red-500' : ''}`}
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onFocus={() => setEmailError('')} // Clear error on focus
            onBlur={() => setEmailError(validateEmailField(email))}
            aria-invalid={!!emailError}
            aria-describedby={emailError ? 'email-error' : undefined}
            required
          />
          {emailError && (
            <p id="email-error" style={{ color: 'red', fontSize: '0.875rem', marginTop: '0.25rem' }}>
              {emailError}
            </p>
          )}
        </div>
        
        {/* Password */}
        <div>
          <label htmlFor="password" className='label'>Password</label>
          <input
            id="password"
            className='input'
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        
        <label className='text-sm'>Don't have an account? <Link href="/signup">Sign up</Link></label>
        <br />
        <label className='text-sm color-[#7C3AED]'><Link href="/resetPassword">Forgot Password?</Link></label>

        <button type="submit" className='btn w-[417px]'>Log In</button>
      </div>
    </form>
  );
}