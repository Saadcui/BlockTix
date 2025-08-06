import { AuthProvider } from '@/context/AuthContext';
import '../styles/globals.css';
import Footer from '@/app/components/footer';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <AuthProvider>
          {children}
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
