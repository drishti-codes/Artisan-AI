'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

export default function SellerProducts() {
  const { user, ready } = useAuth();
  const router = useRouter();
  const [products, setProducts] = useState([]);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  // Load products
  useEffect(() => {
    if (ready && user?.role === 'artisan') {
      fetch('/api/seller/products')
        .then((r) => r.json())
        .then((data) => setProducts(data.data || []))
        .catch(() => setError('Failed to load products'));
    }
  }, [ready, user]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const res = await fetch('/api/seller/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, price: parseFloat(price), category, description }),
      });
      const result = await res.json();
      if (!result.success) throw new Error(result.message || 'Error');
      setProducts((prev) => [...prev, result.data]);
      setName('');
      setPrice('');
      setCategory('');
      setDescription('');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  if (!ready) return null;
  if (!user || user.role !== 'artisan') return <p>Access denied.</p>;

  return (
    <div className="container-page py-16 lg:py-24 flex justify-center">
      <div className="w-full max-w-2xl">
        <h1 className="font-display text-3xl text-brown mb-4">My Products</h1>
        {error && <p className="text-terracotta mb-2">{error}</p>}
        <ul className="space-y-2 mb-6">
          {products.map((p) => (
            <li key={p.id} className="border-b pb-2">
              <strong>{p.name}</strong> – ₹{p.price} – {p.category}
            </li>
          ))}
        </ul>
        <h2 className="font-display text-xl text-brown mb-2">Add New Product</h2>
        <form onSubmit={handleCreate} className="space-y-3">
          <div>
            <label className="block text-sm text-brown/60 mb-1">Name</label>
            <input required value={name} onChange={(e) => setName(e.target.value)} className="w-full border hairline rounded-md px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm text-brown/60 mb-1">Price (₹)</label>
            <input required type="number" value={price} onChange={(e) => setPrice(e.target.value)} className="w-full border hairline rounded-md px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm text-brown/60 mb-1">Category</label>
            <input required value={category} onChange={(e) => setCategory(e.target.value)} className="w-full border hairline rounded-md px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm text-brown/60 mb-1">Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="w-full border hairline rounded-md px-3 py-2" />
          </div>
          <button type="submit" disabled={busy} className="btn-primary rounded-full px-6 py-2 w-full">
            {busy ? 'Creating...' : 'Create Product'}
          </button>
        </form>
        <button onClick={() => router.push('/seller')} className="mt-4 text-terracotta hover:underline">
          Back to Dashboard
        </button>
      </div>
    </div>
  );
}
