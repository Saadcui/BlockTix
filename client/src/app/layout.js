

'use client';

import { AuthProvider } from '@/context/AuthContext';
import Navbar from './components/Navbar';
import '../styles/globals.css';
import Footer from '@/app/components/Footer';
import { Toaster } from 'react-hot-toast';


export default function RootLayout({ children }) {
  return (
    <html>
      <body>
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
