

'use client';

import { AuthProvider } from '@/context/AuthContext';
import Navbar from './components/NavBar';
import '../styles/globals.css';
import Footer from './components/Footer';
import { Toaster } from 'react-hot-toast';


export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className="bg-cover bg-center bg-no-repeat min-h-screen"
        style={{ backgroundImage: "url('/bg.svg')" }}
      >
        <Toaster position="top-right" reverseOrder={false} toastOptions={{style: {  marginTop: '4rem' }}} />
        <AuthProvider>
          <Navbar />
          {children}
          <Footer />
        </AuthProvider>

      </body>
    </html>
  );
}
