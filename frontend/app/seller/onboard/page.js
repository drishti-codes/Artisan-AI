'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SellerOnboardRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/artisan/onboarding');
  }, [router]);

  return null;
}
