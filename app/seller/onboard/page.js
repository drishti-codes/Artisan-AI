'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SellerOnboard() {
  const { user, ready } = useAuth();
  const router = useRouter();

  const [shopName, setShopName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await fetch('/api/seller/onboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shopName, description }),
      });
      router.push('/seller');
    } catch (err) {
      setError('Failed to onboard');
    } finally {
      setBusy(false);
    }
  };

  // Placeholder for voice onboarding – would call Bhashini API
  const startVoiceOnboarding = () => {
    alert('Voice onboarding using Bhashini API would start here.');
  };

  if (!ready) return null;
  if (!user || user.role !== 'artisan') {
    return <p>Access denied.</p>;
  }

  return (
    <div className="container-page py-16 lg:py-24 flex justify-center">
      <div className="w-full max-w-md">
        <h1 className="font-display text-2xl text-brown mb-4">Seller Onboarding</h1>
        <button onClick={startVoiceOnboarding} className="btn-primary rounded-full px-4 py-2 mb-4">
          Voice Onboarding (Bhashini)
        </button>
        <p className="text-sm text-brown/60 mb-2">Or fill the form below:</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-brown/60 mb-1">Shop Name</label>
            <input
              required
              value={shopName}
              onChange={(e) => setShopName(e.target.value)}
              className="w-full border hairline rounded-md px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm text-brown/60 mb-1">Description</label>
            <textarea
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full border hairline rounded-md px-3 py-2"
            />
          </div>
          {error && <p className="text-terracotta text-sm">{error}</p>}
          <button type="submit" disabled={busy} className="btn-primary rounded-full px-6 py-2 w-full">
            {busy ? 'Submitting...' : 'Complete Onboarding'}
          </button>
        </form>
        <Link href="/seller" className="block text-center mt-4 text-terracotta hover:underline">
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
