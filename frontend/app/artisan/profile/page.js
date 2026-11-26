'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Store } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import ArtisanProfileForm from '@/components/artisan/ArtisanProfileForm';

export default function ArtisanProfilePage() {
  const { user, ready, token, logout } = useAuth();
  const router = useRouter();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [formError, setFormError] = useState('');
  const [savedMsg, setSavedMsg] = useState('');
  const [busy, setBusy] = useState(false);

  const loadProfile = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError('');
    try {
      const me = await api('/seller/me', { token });
      setProfile(me);
    } catch (err) {
      if (err?.status === 404) {
        router.replace('/artisan/onboarding');
        return;
      }
      if (err?.status === 401) {
        logout();
        router.replace('/login');
        return;
      }
      if (err?.status === 403) {
        router.replace('/');
        return;
      }
      setError(err?.message || 'Failed to load your profile.');
    } finally {
      setLoading(false);
    }
  }, [token, router, logout]);

  useEffect(() => {
    if (!ready || !user || !token) return;
    loadProfile();
  }, [ready, user, token, loadProfile]);

  const handleSubmit = async (payload) => {
    setFormError('');
    setSavedMsg('');
    setBusy(true);
    try {
      const updated = await api('/seller/onboard', {
        method: 'POST',
        body: payload,
        token,
      });
      setProfile(updated);
      setSavedMsg('Profile and public artisan page updated.');
    } catch (err) {
      setFormError(err?.message || 'Could not update profile.');
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="container-page py-14 lg:py-20">
        <p className="text-sm text-brown/60">Loading your profile…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container-page py-14 lg:py-20">
        <div className="max-w-lg border hairline rounded-sm p-8 bg-white/50">
          <h1 className="font-display text-2xl text-brown mb-2">Artisan Profile</h1>
          <p role="alert" className="text-sm text-terracotta mb-5">{error}</p>
          <button onClick={loadProfile} className="btn-primary rounded-full px-6 py-2.5 text-sm">
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="container-page py-14 lg:py-20">
        <div className="max-w-lg border hairline rounded-sm p-8 bg-white/50 text-center">
          <Store size={32} className="mx-auto text-brown/30 mb-3" strokeWidth={1.3} />
          <h1 className="font-display text-2xl text-brown mb-2">No profile yet</h1>
          <p className="text-sm text-brown/60 mb-5">Complete onboarding to set up your shop.</p>
          <button
            onClick={() => router.push('/artisan/onboarding')}
            className="btn-primary rounded-full px-6 py-2.5 text-sm"
          >
            Start Onboarding
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container-page py-12 lg:py-16">
      <div className="max-w-xl">
        <p className="text-terracotta text-sm mb-2">Artisan Studio</p>
        <h1 className="font-display text-3xl sm:text-4xl text-brown mb-8">Studio Profile</h1>

        <div className="border hairline rounded-sm p-5 bg-white/50 mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-wider text-brown/55">Public Artisan Page</p>
            <Link href={`/artisans/${profile.slug}`} className="text-sm text-terracotta hover:underline mt-0.5 inline-block">
              /artisans/{profile.slug}
            </Link>
          </div>
          <span className="text-xs bg-forest/10 text-forest rounded-full px-3 py-1">Active</span>
        </div>

        <ArtisanProfileForm
          initialValues={profile}
          defaultName={user?.name || ''}
          token={token}
          onSubmit={handleSubmit}
          submitLabel="Save Profile"
          busy={busy}
          error={formError}
          successMsg={savedMsg}
        />
      </div>
    </div>
  );
}
