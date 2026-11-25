"use client";
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function SellerRedirect() {
  const router = useRouter();
  const { ready, user } = useAuth();

  useEffect(() => {
    if (!ready) return;
    // Preserve any path after /seller, redirect to same under /artisan
    const path = window.location.pathname.replace(/^\/seller/, '/artisan');
    router.replace(path);
  }, [ready, router]);

  return null;
}
