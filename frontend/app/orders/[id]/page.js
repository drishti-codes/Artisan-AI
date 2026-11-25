'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { formatINR } from '@/lib/data';
import StatusBadge from '@/components/account/StatusBadge';
import OrderTimeline from '@/components/account/OrderTimeline';
import LoginRequired from '@/components/account/LoginRequired';
import { formatDate } from '@/components/account/format';

const METHODS = { upi: 'UPI', card: 'Card', netbanking: 'Net Banking', wallet: 'Wallet' };

export default function OrderDetailsPage() {
  const { id } = useParams();
  const { user, token, ready } = useAuth();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token || !id) return;
    api(`/orders/${id}`, { token }).then(setOrder).catch((e) => setError(e.message));
  }, [token, id]);

  if (ready && !user) {
    return <LoginRequired next={`/orders/${id}`} title="Please log in to track this order" text="Log in to see the status of your order." />;
  }

  if (error) {
    return (
      <div className="container-page py-24 text-center">
        <h1 className="font-display text-3xl text-brown mb-3">We could not open this order</h1>
        <p className="text-brown/60 mb-8">{error}</p>
        <Link href="/orders" className="btn-primary rounded-full px-8 py-3 text-sm inline-block">Back to my orders</Link>
      </div>
    );
  }

  if (!order) {
    return <div className="container-page py-16 text-sm text-brown/55">Loading your order…</div>;
  }

  return (
    <div className="container-page py-12 lg:py-16">
      <Link href="/orders" className="inline-flex items-center gap-2 text-sm text-terracotta hover:underline underline-offset-4 mb-6">
        <ArrowLeft size={14} /> All orders
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-3 mb-10">
        <div>
          <h1 className="font-display text-4xl text-brown">Order #{order.orderNumber}</h1>
          <p className="text-brown/55 mt-2">Placed on {formatDate(order.createdAt)}</p>
        </div>
        <StatusBadge status={order.status} />
      </div>

      <div className="border hairline rounded-sm p-6 mb-10">
        <h2 className="font-display text-xl text-brown mb-6">Order progress</h2>
        {order.status === 'pending_payment' ? (
          <p className="text-sm text-brown/60">We are waiting for the payment to complete.</p>
        ) : order.status === 'cancelled' ? (
          <p className="text-sm text-terracotta">This order was cancelled.</p>
        ) : (
          <OrderTimeline history={order.statusHistory} />
        )}
      </div>

      <div className="grid lg:grid-cols-[1fr_360px] gap-12">
        <div>
          <h2 className="font-display text-xl text-brown mb-4">Items</h2>
          <div className="divide-y hairline border-y hairline">
            {order.items.map((item) => (
              <div key={item.productId} className="flex items-center gap-5 py-5">
                <div className="relative w-20 h-20 rounded-sm overflow-hidden bg-beige shrink-0">
                  <Image src={item.image} alt={item.name} fill sizes="80px" className="object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <Link href={`/product/${item.productId}`} className="text-sm text-brown hover:text-terracotta transition-colors line-clamp-1">
                    {item.name}
                  </Link>
                  <p className="text-sm text-brown/50 mt-1">Qty {item.qty} · {formatINR(item.price)} each</p>
                </div>
                <p className="text-sm text-brown">{formatINR(item.price * item.qty)}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="border hairline rounded-sm p-6 h-fit">
            <h2 className="font-display text-xl text-brown mb-5">Order Summary</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between text-brown/65"><span>Subtotal</span><span>{formatINR(order.subtotal)}</span></div>
              <div className="flex justify-between text-brown/65"><span>Shipping</span><span>{formatINR(order.shipping)}</span></div>
            </div>
            <div className="flex justify-between mt-5 pt-5 border-t hairline">
              <span className="text-brown">Total</span>
              <span className="font-display text-xl text-brown">{formatINR(order.total)}</span>
            </div>
            <p className="text-xs text-brown/50 mt-4">Payment: {METHODS[order.paymentMethod] || order.paymentMethod}</p>
          </div>

          <div className="border hairline rounded-sm p-6 h-fit">
            <h2 className="font-display text-xl text-brown mb-4">Delivery address</h2>
            <div className="text-sm text-brown/70 leading-relaxed">
              <p className="text-brown">{order.address.name}</p>
              <p>{order.address.line1}</p>
              <p>{order.address.city} — {order.address.pincode}</p>
              <p>Phone: {order.address.phone}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
