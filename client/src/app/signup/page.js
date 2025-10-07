'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Eye, EyeOff } from 'lucide-react';

// Validation helpers
const isValidName = (name) => /^[a-zA-Z\s]+$/.test(name.trim());
const isValidEmail = (email) => {
  const trimmed = email.trim();
  // Must match standard email format AND end with .com
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed) && trimmed.endsWith('.com');
};

export default function SignupPage() {
  const router = useRouter();
  const { signup } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [checkPassword, setCheckPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('user');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Validation state
  const [nameError, setNameError] = useState('');
  const [emailError, setEmailError] = useState('');

  const validateNameField = (val) => {
    if (!val.trim()) return '';
    return isValidName(val) ? '' : 'Please enter a valid name';
  };

  const validateEmailField = (val) => {
    if (!val.trim()) return '';
    return isValidEmail(val) ? '' : 'Please enter a valid email';
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');

    // Validate all fields before submit
    const nErr = validateNameField(name);
    const eErr = validateEmailField(email);
    setNameError(nErr);
    setEmailError(eErr);

    if (nErr || eErr) return;

    if (password !== checkPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      const { role: userRole } = await signup(email, password, name, role);
      router.push(`/dashboard/${userRole}`);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSignup}
      className="flex flex-col items-center justify-center min-h-screen"
    >
      {error && <p style={{ color: 'red' }}>{error}</p>}

      <div className="w-[400px] h-[auto] mx-auto bg-white/20 backdrop-blur-md p-10 rounded-lg">
        <h2 className="font-bold mb-4">Create An Account</h2>

        {/* Name */}
        <div>
          <label htmlFor="name" className="label">Full Name</label>
          <input
            id="name"
            name="name"
            className={`input ${nameError ? 'border-red-500' : ''}`}
            type="text"
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onFocus={() => setNameError('')} // Clear error on focus
            onBlur={() => setNameError(validateNameField(name))}
            aria-invalid={!!nameError}
            aria-describedby={nameError ? 'name-error' : undefined}
            required
          />
          {nameError && (
            <p id="name-error" style={{ color: 'red', fontSize: '0.875rem', marginTop: '0.25rem' }}>
              {nameError}
            </p>
          )}
        </div>

        {/* Email */}
        <div>
          <label htmlFor="email" className="label">Email</label>
          <input
            id="email"
            name="email"
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
          <label htmlFor="password" className="label">Password</label>
          <div style={{ position: 'relative' }}>
            <input
              id="password"
              name="password"
              className="input"
              type={showPassword ? 'text' : 'password'}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              style={{
                position: 'absolute',
                right: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#555',
              }}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          <br />

          <label htmlFor="confirm-password" className="label">Confirm Password</label>
          <input
            id="confirm-password"
            name="confirmPassword"
            className="input"
            type={showPassword ? 'text' : 'password'}
            placeholder="Confirm Password"
            value={checkPassword}
            onChange={(e) => setCheckPassword(e.target.value)}
            required
          />
        </div>

        {/* Role */}
        <div>
          <label htmlFor="role-user"> User </label>
          <input
            type="radio"
            id="role-user"
            name="role"
            value="user"
            checked={role === 'user'}
            onChange={(e) => setRole(e.target.value)}
          />
          <label htmlFor="role-organizer"> Organizer </label>
          <input
            type="radio"
            id="role-organizer"
            name="role"
            value="organizer"
            checked={role === 'organizer'}
            onChange={(e) => setRole(e.target.value)}
          />
        </div>

        <button
          type="submit"
          className="btn w-[417px]"
          disabled={loading}
          style={{ opacity: loading ? 0.75 : 1, marginTop: '1rem' }}
        >
          {loading ? 'Creating Account...' : 'Create Account'}
        </button>
      </div>
    </form>
  );
}