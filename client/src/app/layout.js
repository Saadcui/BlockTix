import { AuthProvider } from '@/context/AuthContext';
import Navbar from './components/Navbar';
import '../styles/globals.css';
import Footer from '@/app/components/footer';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
         <Navbar />
          <Footer />
        <AuthProvider>
          {children}
          
        </AuthProvider>
      </body>
    </html>
  );
}
