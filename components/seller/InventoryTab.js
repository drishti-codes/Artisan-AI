'use client';

import { useState } from 'react';
import Image from 'next/image';
import { api } from '@/lib/api';

export default function InventoryTab({ inventory, token, reload }) {
  const [drafts, setDrafts] = useState({}); // new stock values typed by the seller
  const [error, setError] = useState('');
  const [note, setNote] = useState('');
  const [busyId, setBusyId] = useState('');

  const save = async (item) => {
    setError('');
    setNote('');
    const value = Number(drafts[item.id]);
    if (!Number.isInteger(value) || value < 0) return setError('Stock must be a whole number, 0 or more.');
    setBusyId(item.id);
    try {
      await api(`/seller/inventory/${item.id}`, { method: 'PATCH', token, body: { stock: value } });
      setNote(`Stock updated for ${item.name}.`);
      setDrafts((d) => {
        const copy = { ...d };
        delete copy[item.id];
        return copy;
      });
      await reload();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusyId('');
    }
  };

  if (inventory.length === 0) return <p className="text-sm text-brown/55">You have no products yet.</p>;

  return (
    <div>
      <p className="text-sm text-brown/60 mb-6">Update how many pieces you have. Items with low stock are marked, so you can restock in time.</p>
      {note && <p className="text-sm text-forest mb-4">{note}</p>}
      {error && <p role="alert" className="text-sm text-terracotta mb-4">{error}</p>}

      <div className="divide-y hairline border-y hairline">
        {inventory.map((item) => {
          const changed = drafts[item.id] !== undefined && Number(drafts[item.id]) !== item.stock;
          return (
            <div key={item.id} className="flex flex-wrap items-center gap-5 py-4">
              <div className="relative w-14 h-14 rounded-sm overflow-hidden bg-beige shrink-0">
                <Image src={item.image} alt={item.name} fill sizes="56px" className="object-cover" />
              </div>
              <div className="flex-1 min-w-[160px]">
                <p className="text-sm text-brown line-clamp-1">{item.name}</p>
                <p className="text-xs text-brown/50 mt-1">{item.soldCount} sold · alert below {item.lowStockThreshold}</p>
              </div>
              {item.lowStock && <span className="text-xs bg-terracotta/10 text-terracotta rounded-full px-3 py-1.5">Low stock</span>}
              {!item.isActive && <span className="text-xs bg-beige text-brown/60 rounded-full px-3 py-1.5">Hidden</span>}
              <input
                type="number"
                min="0"
                aria-label={`Stock for ${item.name}`}
                value={drafts[item.id] !== undefined ? drafts[item.id] : item.stock}
                onChange={(e) => setDrafts({ ...drafts, [item.id]: e.target.value })}
                className="w-24 border hairline rounded-md px-3 py-2 text-sm bg-white/70 focus:outline-none focus:border-terracotta"
              />
              <button onClick={() => save(item)} disabled={!changed || busyId === item.id} className="btn-outline rounded-full px-5 py-2 text-sm disabled:opacity-40 disabled:pointer-events-none">
                {busyId === item.id ? 'Saving…' : 'Save'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
