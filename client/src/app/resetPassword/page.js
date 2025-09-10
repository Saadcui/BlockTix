'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';


export default function ResetPage() {
  const router = useRouter();
  const { resetPassword } = useAuth();

  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');


  const handleReset = async (e) => {
    e.preventDefault();
    setError('');
    
     if (!validateEmail(email)) {
    setError('Please enter a valid email address');
    return;
  }

    try {
      setMessage('');
      await resetPassword(email);
      setMessage('Password reset email sent successfully');
    } catch (err) {
      console.error(err);
      setError("Failed to send password reset email");
    }
  };
  const validateEmail = (email) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

  return (
    <form onSubmit={handleReset} className='flex flex-col items-center justify-center min-h-screen' >
      {error && <p style={{ color: 'red' }}>{error}</p>}

      <div className='w-[400px] h-[auto] px-5' >
      <h2 className='font-bold mb-4'>Reset Password</h2>
      <label className='label'>Email</label>
      <input className='input' type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required />
      <label className='text-sm'>Don't have an account? <Link href="/signup">Sign up</Link></label>

      <button type="submit" className='btn w-[417px]'>Reset Password</button>
      </div>
    
    </form>
  );
}
