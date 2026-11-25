"use client";

import { usePathname } from 'next/navigation';
import ArtisanNavbar from '@/components/ArtisanNavbar';
import ArtisanFooter from '@/components/ArtisanFooter';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function LayoutShell({ children }) {
  const pathname = usePathname();
  const isArtisan = pathname.startsWith('/artisan') || pathname.startsWith('/seller');

  return (
    <>
      {isArtisan ? <ArtisanNavbar /> : <Navbar />}
      <main>{children}</main>
      {isArtisan ? <ArtisanFooter /> : <Footer />}
    </>
  );
}
