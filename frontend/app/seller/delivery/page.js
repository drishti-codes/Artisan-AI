'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SellerDeliveryRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/artisan/delivery');
  }, [router]);

  return null;
}
