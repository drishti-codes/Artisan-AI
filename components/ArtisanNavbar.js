'use client';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

export default function ArtisanNavbar() {
  const { logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.replace('/login');
  };

  return (
    <nav className="bg-terracotta text-cream py-4 px-6 flex justify-between items-center">
      <div className="flex items-center gap-4">
        <Link href="/artisan/dashboard" className="font-bold text-xl">ArtisanAI</Link>
        <Link href="/artisan/dashboard">Dashboard</Link>
        <Link href="/artisan/products">My Products</Link>
        <Link href="/artisan/orders">Orders</Link>
        <Link href="/artisan/delivery">Delivery</Link>
        <Link href="/artisan/profile">Profile</Link>
      </div>
      <button onClick={handleLogout} className="border border-cream px-3 py-1 rounded">
        Logout
      </button>
    </nav>
  );
}
