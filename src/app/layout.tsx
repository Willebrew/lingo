import type { Metadata } from 'next';
import localFont from 'next/font/local';
import './globals.css';
import { Toaster } from 'react-hot-toast';

const jakarta = localFont({
  src: [
    {
      path: '../../public/fonts/plus-jakarta-sans-latin.woff2',
      weight: '400 700',
      style: 'normal',
    },
  ],
  variable: '--font-jakarta',
  display: 'swap',
});

const calistoga = localFont({
  src: [
    {
      path: '../../public/fonts/calistoga-latin-400.woff2',
      weight: '400',
      style: 'normal',
    },
  ],
  variable: '--font-cal',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Lingo - Secure Encrypted Messaging',
  description: 'End-to-end encrypted messaging with built-in translation',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${jakarta.variable} ${calistoga.variable} font-sans antialiased`}>
        {children}
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#1f2353',
              color: '#f8f9ff',
              borderRadius: '16px',
              padding: '12px 16px',
            },
            success: {
              style: {
                background: '#0f766e',
                color: '#ecfeff',
              },
            },
            error: {
              style: {
                background: '#b91c1c',
                color: '#fff5f5',
              },
            },
          }}
        />
      </body>
    </html>
  );
}
