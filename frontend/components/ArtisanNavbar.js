'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, LogOut } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const links = [
  { href: '/artisan/dashboard', label: 'Dashboard' },
  { href: '/artisan/products', label: 'My Products' },
  { href: '/artisan/orders', label: 'Orders' },
  { href: '/artisan/delivery', label: 'Delivery' },
  { href: '/artisan/profile', label: 'Profile' },
];

export default function ArtisanNavbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuth();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => setOpen(false), [pathname]);

  const handleLogout = () => {
    logout();
    router.replace('/login');
  };

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-cream/90 backdrop-blur-md shadow-[0_1px_0_rgba(59,33,24,0.1)]' : 'bg-cream/60 backdrop-blur-sm'
      }`}
    >
      <div className="container-page flex items-center justify-between h-20">
        <Link href="/artisan/dashboard" className="font-display text-2xl tracking-tight text-forest">
          Artisan<span className="text-terracotta italic">AI</span>
        </Link>

        <nav className="hidden lg:flex items-center gap-8">
          {links.map((link) => {
            const active = pathname === link.href || pathname?.startsWith(link.href + '/');
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`relative text-[15px] transition-colors ${
                  active ? 'text-terracotta' : 'text-brown/80 hover:text-terracotta'
                }`}
              >
                {link.label}
                {active && (
                  <motion.span
                    layoutId="artisan-nav-underline"
                    className="absolute -bottom-1.5 left-0 right-0 h-[2px] bg-terracotta rounded-full"
                  />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <button
            onClick={handleLogout}
            className="hidden lg:inline-flex items-center gap-2 border hairline rounded-full px-5 py-2 text-sm text-brown hover:border-terracotta hover:text-terracotta transition-colors"
          >
            <LogOut size={15} strokeWidth={1.6} />
            Logout
          </button>
          <button
            aria-label="Menu"
            onClick={() => setOpen((v) => !v)}
            className="lg:hidden p-2.5 rounded-full hover:bg-beige transition-colors"
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.nav
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="lg:hidden overflow-hidden border-t hairline bg-cream"
          >
            <div className="container-page py-4 flex flex-col gap-4">
              {links.map((link) => {
                const active = pathname === link.href || pathname?.startsWith(link.href + '/');
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`text-base py-1 transition-colors ${
                      active ? 'text-terracotta font-medium' : 'text-brown/85 hover:text-terracotta'
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
              <button
                onClick={handleLogout}
                className="text-left text-base py-1 text-terracotta hover:underline flex items-center gap-2"
              >
                <LogOut size={16} strokeWidth={1.6} />
                Logout
              </button>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
