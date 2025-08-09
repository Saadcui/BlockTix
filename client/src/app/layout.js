

'use client';

import { AuthProvider } from '@/context/AuthContext';
import Navbar from './components/Navbar';
import '../styles/globals.css';
import Footer from '@/app/components/Footer';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <AuthProvider>
          <Navbar />
          {children}
          <Footer />
        </AuthProvider>

      </body>
    </html>
  );
}
