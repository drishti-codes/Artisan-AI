'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Truck } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';

export default function ArtisanDeliveryPage() {
  const { user, ready, token, logout } = useAuth();
  const router = useRouter();

  const [apiKey, setApiKey] = useState('');
  const [savedKey, setSavedKey] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [formError, setFormError] = useState('');
  const [savedMsg, setSavedMsg] = useState('');
  const [busy, setBusy] = useState(false);

  const loadDelivery = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError('');
    try {
      await api('/seller/me', { token });
      const data = await api('/seller/delivery', { token });
      setSavedKey(data?.apiKey || '');
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
      setError(err?.message || 'Failed to load delivery settings.');
    } finally {
      setLoading(false);
    }
  }, [token, router, logout]);

  useEffect(() => {
    if (!ready || !user || !token) return;
    loadDelivery();
  }, [ready, user, token, loadDelivery]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setSavedMsg('');
    setBusy(true);
    try {
      const data = await api('/seller/delivery', {
        method: 'POST',
        body: { apiKey: apiKey.trim() },
        token,
      });
      setSavedKey(data?.apiKey || apiKey.trim());
      setApiKey('');
      setSavedMsg('Delivery API key saved.');
    } catch (err) {
      setFormError(err?.message || 'Could not save API key.');
    } finally {
      setBusy(false);
    }
  };

  const inputClass =
    'w-full border hairline rounded-md px-4 py-2.5 text-sm bg-white/70 focus:outline-none focus:border-terracotta';

  if (loading) {
    return (
      <div className="container-page py-14 lg:py-20">
        <p className="text-sm text-brown/60">Loading delivery settings…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container-page py-14 lg:py-20">
        <div className="max-w-lg border hairline rounded-sm p-8 bg-white/50">
          <h1 className="font-display text-2xl text-brown mb-2">Delivery Partner</h1>
          <p role="alert" className="text-sm text-terracotta mb-5">{error}</p>
          <button onClick={loadDelivery} className="btn-primary rounded-full px-6 py-2.5 text-sm">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container-page py-12 lg:py-16">
      <div className="max-w-xl">
        <p className="text-terracotta text-sm mb-2">Artisan Studio</p>
        <h1 className="font-display text-3xl sm:text-4xl text-brown mb-8">Delivery Partner</h1>

        {savedKey ? (
          <div className="border hairline rounded-sm p-5 bg-white/50 mb-6">
            <p className="text-xs uppercase tracking-wider text-brown/55 mb-1">Current API Key</p>
            <p className="text-sm text-brown font-mono break-all">{savedKey}</p>
          </div>
        ) : (
          <div className="border hairline rounded-sm p-6 bg-white/50 mb-6 flex items-start gap-4">
            <Truck size={24} className="text-brown/35 shrink-0 mt-0.5" strokeWidth={1.5} />
            <div>
              <p className="text-sm text-brown font-medium">No delivery partner connected yet</p>
              <p className="text-xs text-brown/60 mt-1">
                Add your delivery partner API key below to enable shipment integration.
              </p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="border hairline rounded-sm p-6 sm:p-8 bg-white/50 space-y-4">
          <div>
            <label className="block text-sm text-brown/60 mb-1.5">
              {savedKey ? 'Update Delivery API Key' : 'Delivery API Key'}
            </label>
            <input
              type="text"
              required
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter your delivery partner API key"
              className={inputClass}
            />
          </div>

          {formError && <p role="alert" className="text-sm text-terracotta">{formError}</p>}
          {savedMsg && <p className="text-sm text-forest">{savedMsg}</p>}

          <button
            type="submit"
            disabled={busy}
            className="btn-primary rounded-full px-7 py-3 text-sm disabled:opacity-70"
          >
            {busy ? 'Saving…' : 'Save API Key'}
          </button>
        </form>
      </div>
    </div>
  );
}
