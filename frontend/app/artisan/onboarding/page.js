'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Store } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import ArtisanProfileForm from '@/components/artisan/ArtisanProfileForm';

export default function ArtisanOnboardingPage() {
  const { user, ready, token, logout } = useAuth();
  const router = useRouter();

  const [initialValues, setInitialValues] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const checkExisting = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setLoadError('');
    try {
      const me = await api('/seller/me', { token });
      setInitialValues(me || {});
    } catch (err) {
      if (err?.status === 404) {
        setInitialValues({});
      } else if (err?.status === 401) {
        logout();
        router.replace('/login');
        return;
      } else if (err?.status === 403) {
        router.replace('/');
        return;
      } else {
        setLoadError(err?.message || 'Could not check profile status.');
      }
    } finally {
      setLoading(false);
    }
  }, [token, router, logout]);

  useEffect(() => {
    if (!ready || !user || !token) return;
    checkExisting();
  }, [ready, user, token, checkExisting]);

  const handleSubmit = async (payload) => {
    setError('');
    setBusy(true);
    try {
      await api('/seller/onboard', {
        method: 'POST',
        body: payload,
        token,
      });
      router.replace('/artisan/dashboard');
    } catch (err) {
      setError(err?.message || 'Failed to complete onboarding. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="container-page py-16 lg:py-24 flex justify-center">
        <p className="text-sm text-brown/60">Preparing onboarding…</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="container-page py-16 lg:py-24 flex justify-center">
        <div className="w-full max-w-md border hairline rounded-sm p-8 bg-white/50">
          <h1 className="font-display text-2xl text-brown mb-2">Artisan Onboarding</h1>
          <p role="alert" className="text-sm text-terracotta mb-5">{loadError}</p>
          <button onClick={checkExisting} className="btn-primary rounded-full px-6 py-2.5 text-sm">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container-page py-14 lg:py-20 flex justify-center">
      <div className="w-full max-w-xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-11 h-11 rounded-full bg-forest/10 text-forest mb-4">
            <Store size={20} strokeWidth={1.6} />
          </div>
          <h1 className="font-display text-3xl text-brown mb-2">Set up your studio</h1>
          <p className="text-sm text-brown/60">
            Tell customers about your workshop, craft, and story so your shop goes live.
          </p>
        </div>

        <ArtisanProfileForm
          initialValues={initialValues || {}}
          defaultName={user?.name || ''}
          token={token}
          onSubmit={handleSubmit}
          submitLabel="Complete Onboarding"
          busy={busy}
          error={error}
        />

        <Link href="/artisan/dashboard" className="block text-center mt-5 text-sm text-terracotta hover:underline">
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
