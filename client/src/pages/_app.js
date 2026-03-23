/**
 * Next.js App wrapper
 * Provides global context providers and styles
 */
import '../styles/globals.css';
import { useEffect } from 'react';
import { AuthProvider } from '../contexts/AuthContext';
import { CartProvider } from '../contexts/CartContext';
import { Toaster } from 'react-hot-toast';

export default function App({ Component, pageProps }) {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Keep one frontend origin to avoid separate browser storage buckets.
    if (window.location.hostname === '127.0.0.1') {
      const nextUrl = `http://localhost:${window.location.port}${window.location.pathname}${window.location.search}${window.location.hash}`;
      window.location.replace(nextUrl);
    }
  }, []);

  return (
    <AuthProvider>
      <CartProvider>
        <Component {...pageProps} />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: { background: '#333', color: '#fff' },
            success: { iconTheme: { primary: '#22c55e', secondary: '#fff' } },
            error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
          }}
        />
      </CartProvider>
    </AuthProvider>
  );
}
