'use client';
import { usePathname } from 'next/navigation';

export default function Navbar() {
  const { user, ready, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const isSellerPage = pathname?.startsWith('/seller');

  const handleLogout = () => {
    logout();
    router.replace('/');
  };

  return (
    <nav className="bg-brown/5 border-b border-brown/10 py-3">
      <div className="container-page flex items-center justify-between">
        <Link href="/" className="font-display text-2xl text-brown">ArtisanAI</Link>
        {ready && (
          <ul className="flex gap-4 items-center">
            {user && (isSellerPage || user.role === 'artisan') ? (
              <>
                <li>
                  <Link href="/seller" className="text-brown hover:underline">Seller Dashboard</Link>
                </li>
                <li>
                  <Link href="/seller/products" className="text-brown hover:underline">My Products</Link>
                </li>
                <li>
                  <Link href="/seller/delivery" className="text-brown hover:underline">Delivery Partner</Link>
                </li>
                <li>
                  <Link href="/seller/sales" className="text-brown hover:underline">Sales</Link>
                </li>
                <li>
                  <button onClick={handleLogout} className="text-terracotta hover:underline">Logout</button>
                </li>
              </>
            ) : (
              <>
                <li>
                  <Link href="/" className="text-brown hover:underline">Home</Link>
                </li>
                <li>
                  <Link href="/shop" className="text-brown hover:underline">Shop</Link>
                </li>
                <li>
                  <Link href="/orders" className="text-brown hover:underline">My Orders</Link>
                </li>
                <li>
                  {user ? (
                    <button onClick={handleLogout} className="text-terracotta hover:underline">Logout</button>
                  ) : (
                    <Link href="/login" className="text-brown hover:underline">Login / Register</Link>
                  )}
                </li>
              </>
            )}
          </ul>
        )}
      </div>
    </nav>
  );
}
