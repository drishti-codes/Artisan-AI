'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function ArtisanLayout({ children }) {
  const { ready, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!ready) return;
    if (!user) {
      router.replace('/login');
    } else if (user.role !== 'artisan' && user.role !== 'admin') {
      router.replace('/');
    }
  }, [ready, user, router]);

  if (!ready) {
    return (
      <div className="container-page py-20 text-center text-sm text-brown/60">
        Loading workspace…
      </div>
    );
  }

  if (!user || (user.role !== 'artisan' && user.role !== 'admin')) {
    return null;
  }

  return <>{children}</>;
}
