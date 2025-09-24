

'use client';

import { AuthProvider } from '@/context/AuthContext';
import { ThemeProvider } from '@/context/ThemeContext';
import Navbar from './components/Navbar';
import '../styles/globals.css';
import Footer from '@/app/components/Footer';
import { Toaster } from 'react-hot-toast';


export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className="bg-cover bg-center bg-no-repeat min-h-screen transition-colors duration-300"
        style={{ backgroundImage: "url('/bg.svg')" }}
      >
        <ThemeProvider>
          <Toaster 
            position="top-right" 
            reverseOrder={false} 
            toastOptions={{
              style: { marginTop: '4rem' },
              className: 'dark:bg-gray-800 dark:text-gray-100'
            }} 
          />
          <AuthProvider>
            <Navbar />
            {children}
            <Footer />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
