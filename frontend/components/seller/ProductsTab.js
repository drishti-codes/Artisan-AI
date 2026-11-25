'use client';

import { useState } from 'react';
import Image from 'next/image';
import { api } from '@/lib/api';
import { formatINR } from '@/lib/data';

const DEFAULT_IMAGE = '/images/products/default.svg';
const inputClass = 'w-full border hairline rounded-md px-4 py-2.5 text-sm bg-white/70 focus:outline-none focus:border-terracotta';
const labelClass = 'text-sm text-brown/60 block mb-1.5';
const EMPTY = { name: '', category: '', price: '', stock: '10', materials: '', description: '', image: '' };

// Only these image sources can be shown by the website
const imageAllowed = (url) => !url || url.startsWith('/images/') || url.startsWith('https://images.unsplash.com/');

export default function ProductsTab({ products, categories, token, reload }) {
  const [editing, setEditing] = useState(null); // null = closed, 'new' = add form, or a product
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const openNew = () => {
    setForm({ ...EMPTY, category: categories[0] ? categories[0].slug : '' });
    setError('');
    setNote('');
    setEditing('new');
  };

  const openEdit = (p) => {
    setForm({ name: p.name, category: p.category, price: String(p.price), stock: String(p.stock), materials: p.materials || '', description: p.description || '', image: '' });
    setError('');
    setNote('');
    setEditing(p);
  };

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.name.trim().length < 3) return setError('Product name must be at least 3 characters.');
    if (!(Number(form.price) >= 1)) return setError('Price must be at least 1.');
    if (!(Number(form.stock) >= 0)) return setError('Stock cannot be negative.');
    if (!imageAllowed(form.image.trim())) return setError('Image link must start with /images/ or https://images.unsplash.com/ (or leave it empty).');

    const body = {
      name: form.name.trim(),
      category: form.category,
      price: Number(form.price),
      stock: Math.floor(Number(form.stock)),
      materials: form.materials.trim(),
      description: form.description.trim(),
    };
    const image = form.image.trim();

    setBusy(true);
    try {
      if (editing === 'new') {
        const picture = image || DEFAULT_IMAGE;
        await api('/products', { method: 'POST', token, body: { ...body, image: picture, gallery: [picture] } });
        setNote('Product added.');
      } else {
        if (image) Object.assign(body, { image, gallery: [image] });
        await api(`/products/${editing.id}`, { method: 'PATCH', token, body });
        setNote('Product updated.');
      }
      setEditing(null);
      await reload();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const toggleVisible = async (p) => {
    setError('');
    const wasVisible = p.isActive;
    try {
      if (wasVisible) await api(`/products/${p.id}`, { method: 'DELETE', token });
      else await api(`/products/${p.id}`, { method: 'PATCH', token, body: { isActive: true } });
      setNote(wasVisible ? `${p.name} is now hidden from the shop.` : `${p.name} is visible in the shop again.`);
      await reload();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-brown/60">{products.length} {products.length === 1 ? 'product' : 'products'} in your shop</p>
        {!editing && <button onClick={openNew} className="btn-primary rounded-full px-6 py-2.5 text-sm">Add product</button>}
      </div>

      {note && <p className="text-sm text-forest mb-4">{note}</p>}
      {!editing && error && <p role="alert" className="text-sm text-terracotta mb-4">{error}</p>}

      {editing && (
        <form onSubmit={submit} className="border hairline rounded-sm p-6 mb-8 space-y-4">
          <h2 className="font-display text-xl text-brown">{editing === 'new' ? 'Add a new product' : `Edit ${editing.name}`}</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className={labelClass}>Product name</label>
              <input value={form.name} onChange={set('name')} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Craft category</label>
              <select value={form.category} onChange={set('category')} className={inputClass}>
                {categories.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Materials</label>
              <input value={form.materials} onChange={set('materials')} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Price (₹)</label>
              <input type="number" min="1" value={form.price} onChange={set('price')} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Stock</label>
              <input type="number" min="0" value={form.stock} onChange={set('stock')} className={inputClass} />
            </div>
            <div className="md:col-span-2">
              <label className={labelClass}>Description</label>
              <textarea rows={3} value={form.description} onChange={set('description')} className={inputClass} />
            </div>
            <div className="md:col-span-2">
              <label className={labelClass}>Image link {editing !== 'new' && '(leave empty to keep the current picture)'}</label>
              <input value={form.image} onChange={set('image')} placeholder="Optional" className={inputClass} />
              <p className="text-xs text-brown/45 mt-1.5">Use a link starting with /images/ or https://images.unsplash.com/. Leave empty to use a default picture.</p>
            </div>
          </div>
          {error && <p role="alert" className="text-sm text-terracotta">{error}</p>}
          <div className="flex gap-3">
            <button type="submit" disabled={busy} className="btn-primary rounded-full px-6 py-2.5 text-sm disabled:opacity-70">{busy ? 'Saving…' : editing === 'new' ? 'Add product' : 'Save changes'}</button>
            <button type="button" onClick={() => setEditing(null)} className="btn-outline rounded-full px-6 py-2.5 text-sm">Cancel</button>
          </div>
        </form>
      )}

      {products.length === 0 ? (
        <p className="text-sm text-brown/55">You have not added any products yet.</p>
      ) : (
        <div className="divide-y hairline border-y hairline">
          {products.map((p) => (
            <div key={p.id} className="flex items-center gap-5 py-4">
              <div className="relative w-16 h-16 rounded-sm overflow-hidden bg-beige shrink-0">
                <Image src={p.image || DEFAULT_IMAGE} alt={p.name} fill sizes="64px" className="object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-brown line-clamp-1">{p.name}</p>
                <p className="text-xs text-brown/50 mt-1">{formatINR(p.price)} · Stock {p.stock}</p>
              </div>
              <span className={`text-xs rounded-full px-3 py-1.5 ${p.isActive ? 'bg-forest/10 text-forest' : 'bg-beige text-brown/60'}`}>{p.isActive ? 'Visible' : 'Hidden'}</span>
              <button onClick={() => openEdit(p)} className="text-sm text-terracotta hover:underline underline-offset-4">Edit</button>
              <button onClick={() => toggleVisible(p)} className="text-sm text-brown/55 hover:text-terracotta">{p.isActive ? 'Hide' : 'Show'}</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
