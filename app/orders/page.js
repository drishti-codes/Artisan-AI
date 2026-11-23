'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Package } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { formatINR } from '@/lib/data';
import StatusBadge from '@/components/account/StatusBadge';
import LoginRequired from '@/components/account/LoginRequired';
import { formatDate } from '@/components/account/format';

export default function OrdersPage() {
  const { user, token, ready } = useAuth();
  const [orders, setOrders] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) return;
    api('/orders', { token }).then(setOrders).catch((e) => setError(e.message));
  }, [token]);

  if (ready && !user) {
    return <LoginRequired next="/orders" title="Please log in to see your orders" text="Log in to track your orders and see your order history." />;
  }

  if (orders && orders.length === 0) {
    return (
      <div className="container-page py-24 text-center">
        <Package size={36} className="mx-auto text-brown/30 mb-5" strokeWidth={1.3} />
        <h1 className="font-display text-3xl text-brown mb-3">No orders yet</h1>
        <p className="text-brown/60 mb-8">When you place an order, you can track it here.</p>
        <Link href="/shop" className="btn-primary rounded-full px-8 py-3 text-sm inline-block">Browse the shop</Link>
      </div>
    );
  }

  return (
    <div className="container-page py-12 lg:py-16">
      <div className="max-w-lg mb-10">
        <p className="text-terracotta text-sm mb-2">My Account</p>
        <h1 className="font-display text-4xl text-brown">My Orders</h1>
      </div>

      {error && <p role="alert" className="text-sm text-terracotta mb-6">{error}</p>}
      {!orders && !error && <p className="text-sm text-brown/55">Loading your orders…</p>}

      <div className="space-y-5">
        {(orders || []).map((order) => (
          <div key={order.id} className="border hairline rounded-sm p-6">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
              <div>
                <p className="text-brown">Order #{order.orderNumber}</p>
                <p className="text-sm text-brown/50 mt-0.5">Placed on {formatDate(order.createdAt)}</p>
              </div>
              <StatusBadge status={order.status} />
            </div>

            <div className="divide-y hairline border-y hairline">
              {order.items.map((item) => (
                <div key={item.productId} className="flex items-center gap-4 py-3">
                  <div className="relative w-14 h-14 rounded-sm overflow-hidden bg-beige shrink-0">
                    <Image src={item.image} alt={item.name} fill sizes="56px" className="object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-brown line-clamp-1">{item.name}</p>
                    <p className="text-xs text-brown/50 mt-0.5">Qty {item.qty} · {formatINR(item.price)} each</p>
                  </div>
                  <p className="text-sm text-brown">{formatINR(item.price * item.qty)}</p>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between mt-5">
              <p className="text-sm text-brown/60">
                Total <span className="font-display text-xl text-brown ml-2">{formatINR(order.total)}</span>
              </p>
              <Link href={`/orders/${order.id}`} className="btn-outline rounded-full px-6 py-2.5 text-sm">
                Track order
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
