'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function SignupPage() {
  const router = useRouter();
  const { signup , user } = useAuth();  

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [checkPassword, setCheckPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('user');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);


  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');
    
     if (!validateEmail(email)) {
    setError('Please enter a valid email address');
    return;
  }
    setLoading(true);
    try {
      if (password !== checkPassword) {
        setError('Passwords do not match');
        return;
      }
      const { role:userRole } = await signup(email, password, name, role);
      router.push(`/dashboard/${userRole}`);

    } catch (err) {
      console.error(err);
      setError(err.message);
      setLoading(false);
    }
  };

    const validateEmail = (email) => {
      const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return regex.test(email);
    };
  return (
    <form onSubmit={handleSignup} className="flex flex-col items-center justify-center min-h-screen" >
      
      {error && <p style={{ color: 'red' }}>{error}</p>}

    
      <div className='w-[400px] h-[auto] mx-auto bg-white/20 backdrop-blur-md p-10 rounded-lg ' >
      <h2 className='font-bold mb-4'>Create An Account</h2>
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
      <button type="submit" className='btn w-[417px]' disabled={loading} style={{ opacity: loading ? 0.75 : 1 }}>Create Account</button>
      </div>
    </form>
  );
}
