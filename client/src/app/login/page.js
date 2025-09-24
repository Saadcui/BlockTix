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
      {error && <p style={{ color: 'red' }}>{error}</p>}

      <div className='w-[400px] h-[auto] bg-white/20 backdrop-blur-md p-10 rounded-lg' >
      <h2 className='font-bold mb-4'>Login</h2>
      <label className='label'>Email</label>
      <input className='input' type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required />
      <label className='label'>Password</label>
      <input className='input' type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required />
      <label className='text-sm'>Don't have an account? <Link href="/signup">Sign up</Link></label>
      <br />
      <label className='text-sm color-[#7C3AED]'><Link href="/resetPassword">Forgot Password?</Link></label>

      <button type="submit" className='btn w-[417px]'>Log In</button>
      </div>
    
    </form>
  );
}
