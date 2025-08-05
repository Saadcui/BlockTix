import { AuthProvider } from '@/context/AuthContext';
import '../styles/globals.css';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
