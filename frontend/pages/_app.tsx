import type { AppProps } from 'next/app';
import { Toaster } from 'react-hot-toast';
import '../styles/globals.css';
import { AuthProvider } from '@/contexts/AuthContext';
import { DonateProvider } from '@/components/donate/DonateModalContext';

export default function MyApp({ Component, pageProps }: AppProps) {
  return (
    <AuthProvider>
      <DonateProvider>
        <Toaster position="top-right" />
        <Component {...pageProps} />
      </DonateProvider>
    </AuthProvider>
  );
}
