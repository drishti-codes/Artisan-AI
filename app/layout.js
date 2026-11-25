import { Fraunces, Work_Sans } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { CartProvider } from '@/context/CartContext';
import LayoutShell from '@/components/LayoutShell';

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-fraunces',
  weight: ['400', '500', '600'],
  style: ['normal', 'italic'],
  display: 'swap',
});

const workSans = Work_Sans({
  subsets: ['latin'],
  variable: '--font-work-sans',
  weight: ['400', '500', '600'],
  display: 'swap',
});

export const metadata = {
  title: 'ArtisanAI — Handmade by Real People, Not Just Machines',
  description: 'Discover authentic Indian crafts directly from local artisans, and shop with an AI companion built to understand the story behind every piece.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${fraunces.variable} ${workSans.variable}`}> 
      <body className="font-body grain bg-cream text-brown">
        <AuthProvider>
          <CartProvider>
            <LayoutShell>{children}</LayoutShell>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
