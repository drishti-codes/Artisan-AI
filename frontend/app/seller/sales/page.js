'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SellerSalesRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/artisan/dashboard');
  }, [router]);

  return null;
}
