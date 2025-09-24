'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';


export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
     if (!validateEmail(email)) {
    setError('Please enter a valid email address');
    return;
  }

    try {
      const { role } = await login(email, password);
      router.push(`/dashboard/${role}`);

    } catch (err) {
      console.error(err);
      setError("Account not found!");
    }
  };
  const validateEmail = (email) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };
  return (
    <form onSubmit={handleLogin} className='flex flex-col items-center justify-center min-h-screen' >
      {error && <p className="text-red-500 dark:text-red-400 mb-4">{error}</p>}

      <div className='w-[400px] h-[auto] card p-10' >
      <h2 className='font-bold mb-4 text-gray-900 dark:text-gray-100 text-2xl'>Login</h2>
      <label className='label'>Email</label>
      <input className='input' type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required />
      <label className='label'>Password</label>
      <input className='input' type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required />
      <label className='text-sm text-gray-600 dark:text-gray-400'>Don't have an account? <Link href="/signup" className="text-primary-500 dark:text-purple-400 hover:underline">Sign up</Link></label>
      <br />
      <label className='text-sm text-primary-500 dark:text-purple-400'><Link href="/resetPassword" className="hover:underline">Forgot Password?</Link></label>

      <button type="submit" className='btn w-[417px]'>Log In</button>
      </div>
    
    </form>
  );
}
