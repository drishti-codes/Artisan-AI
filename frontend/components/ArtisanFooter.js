'use client';

import Link from 'next/link';

export default function ArtisanFooter() {
  return (
    <footer className="bg-forest text-cream/90 mt-24">
      <div className="container-page py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/artisan/dashboard" className="font-display text-xl text-cream">
            Artisan<span className="text-gold italic">AI</span>
          </Link>
          <span className="text-xs text-cream/55">Artisan Studio</span>
        </div>

        <div className="flex flex-wrap items-center gap-6 text-xs text-cream/70">
          <Link href="/artisan/dashboard" className="hover:text-cream transition-colors">Dashboard</Link>
          <Link href="/artisan/products" className="hover:text-cream transition-colors">My Products</Link>
          <Link href="/artisan/orders" className="hover:text-cream transition-colors">Orders</Link>
          <Link href="/artisan/profile" className="hover:text-cream transition-colors">Profile</Link>
        </div>

        <p className="text-xs text-cream/55">
          © {new Date().getFullYear()} ArtisanAI. Crafted with care in India.
        </p>
      </div>
    </footer>
  );
}
