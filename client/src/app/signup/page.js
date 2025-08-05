'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function SignupPage() {
  const router = useRouter();
  const { signup } = useAuth();  

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [checkPassword, setCheckPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('user');
  const [error, setError] = useState('');

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');

    try {
      if (password !== checkPassword) {
        setError('Passwords do not match');
        return;
      }
      const { role } = await signup(email, password, name, role);
      router.push(`/dashboard/${role}`);

    } catch (err) {
      console.error(err);
      setError(err.message);
    }
  };

  return (
    <form onSubmit={handleSignup} className="flex flex-col items-center justify-center min-h-screen" >
      
      {error && <p style={{ color: 'red' }}>{error}</p>}

    
      <div className='w-[300px] h-[auto] mx-auto ' >
      <label className='label font-bold'>Create An Account</label>
      <div>
      <label className='label'>Full Name</label>
      <input className='input' type="text" placeholder="Name"  value={name}  onChange={e => setName(e.target.value)} required />
      </div>
      <div>
      <label className='label'>Email</label>
      <input className='input' type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required />
      </div>
      <div>
      <label className='label'>Password</label>
      <input className='input' type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required />
      <br />
      <label className='label'>Confirm Password</label>
      <input className='input' type="password" placeholder="Confirm Password" value={checkPassword} onChange={e => setCheckPassword(e.target.value)} required />
      </div>
      <div>
      <label >User </label>
      <input type='radio' value='user' checked={role === 'user'} onChange={e => setRole(e.target.value)} />
      <label >Organizer</label>
      <input type='radio' value='organizer' checked={role === 'organizer'} onChange={e => setRole(e.target.value)} />
      </div>
      <button type="submit" className='btn'>Create Account</button>
      </div>
    </form>
  );
}
