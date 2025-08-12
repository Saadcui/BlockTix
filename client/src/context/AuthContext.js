'use client';
import React, { createContext, useContext, useEffect, useState } from "react";
import { auth } from "../firebase";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState();
  const [loading, setLoading] = useState(true);


const signup = async (email, password, name, role) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    const res = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        firebase_uid: user.uid,
        email,
        name,
        role
      }),
    });

      const text = await res.text();
      console.log('Raw response from /api/users:', text);

      if (!res.ok) {
        throw new Error('Failed to save user to database');
      }
    return { role };
};

const login = async (email, password) => {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  const firebaseUID = userCredential.user.uid;

  const res = await fetch(`/api/users/${firebaseUID}`);
  const user = await res.json();

  if (!res.ok) throw new Error('Failed to fetch user role');

  return { role: user.role };
};


const logout = () => {
    return signOut(auth);
 };

useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const res = await fetch(`/api/users/${firebaseUser.uid}`);
          if (!res.ok) throw new Error("Failed to fetch role");

          const userData = await res.json();

          setCurrentUser({
            ...firebaseUser,
            role: userData.role,
          });
        } catch (error) {
          console.error("Error fetching user role:", error);
          setCurrentUser(firebaseUser); 
        }
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider value={{ user: currentUser, signup, login, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
