'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import { formatINR } from '@/lib/data';
import StatusBadge from '@/components/account/StatusBadge';
import { formatDate } from '@/components/account/format';

// What the seller can do next for each status
const NEXT = {
  paid: ['processing', 'Start processing'],
  processing: ['shipped', 'Mark as shipped'],
  shipped: ['delivered', 'Mark as delivered'],
};

export default function OrdersTab({ orders, token, reload }) {
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState('');

  const move = async (order, status) => {
    setError('');
    setBusyId(order.id);
    try {
      await api(`/seller/orders/${order.id}/status`, { method: 'PATCH', token, body: { status } });
      await reload();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusyId('');
    }
  };

  if (orders.length === 0) {
    return <p className="text-sm text-brown/55">No orders yet. Orders appear here after a customer pays.</p>;
  }

  return (
    <div className="space-y-5">
      {error && <p role="alert" className="text-sm text-terracotta">{error}</p>}
      {orders.map((order) => {
        const next = NEXT[order.status];
        return (
          <div key={order.id} className="border hairline rounded-sm p-6">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
              <div>
                <p className="text-brown">Order #{order.orderNumber}</p>
                <p className="text-sm text-brown/50 mt-0.5">Placed on {formatDate(order.createdAt)}</p>
              </div>
              <StatusBadge status={order.status} />
            </div>

            <div className="grid md:grid-cols-[1fr_260px] gap-6">
              <div className="divide-y hairline border-y hairline">
                {order.items.map((item) => (
                  <div key={item.productId} className="flex items-center justify-between py-3 text-sm">
                    <span className="text-brown">{item.name} <span className="text-brown/50">× {item.qty}</span></span>
                    <span className="text-brown/70">{formatINR(item.price * item.qty)}</span>
                  </div>
                ))}
              </div>
              <div className="text-sm text-brown/70 leading-relaxed">
                <p className="text-brown/50 text-xs mb-1">Ship to</p>
                <p className="text-brown">{order.address.name}</p>
                <p>{order.address.line1}</p>
                <p>{order.address.city} — {order.address.pincode}</p>
                <p>Phone: {order.address.phone}</p>
              </div>
            </div>

            <div className="flex items-center justify-between mt-5">
              <p className="text-sm text-brown/60">Your total <span className="font-display text-xl text-brown ml-2">{formatINR(order.sellerTotal)}</span></p>
              {next && (
                <button onClick={() => move(order, next[0])} disabled={busyId === order.id} className="btn-primary rounded-full px-6 py-2.5 text-sm disabled:opacity-70">
                  {busyId === order.id ? 'Updating…' : next[1]}
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
