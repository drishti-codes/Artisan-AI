'use client';

import { api } from '@/lib/api';

  // load existing key
  useEffect(() => {
    if (!ready) return;
    const load = async () => {
      try {
-        const res = await fetch('/api/seller/delivery');
-        const json = await res.json();
-        if (json.success) setSavedKey(json.data.apiKey || '');
+        const json = await api('/seller/delivery', { token });
+        if (json) setSavedKey(json.apiKey || '');
      } catch (e) {
        console.error(e);
      }
    };
    load();
  }, [ready]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
-      const res = await fetch('/api/seller/delivery', {
-        method: 'POST',
-        headers: { 'Content-Type': 'application/json' },
-        body: JSON.stringify({ apiKey }),
-      });
-      const json = await res.json();
-      if (!json.success) throw new Error(json.message || 'Failed');
-      setSavedKey(json.data.apiKey);
+      const json = await api('/seller/delivery', { method: 'POST', body: { apiKey }, token });
+      setSavedKey(json.apiKey);
       setApiKey('');
     } catch (e) {
       setError(e.message);
     } finally {
       setBusy(false);
     }
   };

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function DeliveryPartner() {
  const { user, ready, logout } = useAuth();
  const router = useRouter();
  const [apiKey, setApiKey] = useState('');
  const [savedKey, setSavedKey] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  // load existing key
  useEffect(() => {
    if (!ready) return;
    const load = async () => {
      try {
        const res = await fetch('/api/seller/delivery');
        const json = await res.json();
        if (json.success) setSavedKey(json.data.apiKey || '');
      } catch (e) {
        console.error(e);
      }
    };
    load();
  }, [ready]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const res = await fetch('/api/seller/delivery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message || 'Failed');
      setSavedKey(json.data.apiKey);
      setApiKey('');
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  if (!ready) return null;
  if (!user || user.role !== 'artisan') {
    return <p>Access denied.</p>;
  }

  return (
    <div className="container-page py-16 lg:py-24 flex justify-center">
      <div className="w-full max-w-md">
        <h1 className="font-display text-2xl text-brown mb-4">Delivery Partner</h1>
        {savedKey && (
          <p className="mb-2">
            <strong>Saved API Key:</strong> {savedKey}
          </p>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block text-sm text-brown/60 mb-1">API Key</label>
          <input
            type="text"
            required
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            className="w-full border hairline rounded-md px-3 py-2"
          />
          {error && <p className="text-terracotta text-sm">{error}</p>}
          <button
            type="submit"
            disabled={busy}
            className="btn-primary rounded-full px-6 py-2 w-full"
          >
            {busy ? 'Saving…' : 'Save API Key'}
          </button>
        </form>
        <Link href="/seller" className="block text-center mt-4 text-terracotta hover:underline">
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
