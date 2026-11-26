'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShoppingBag } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { formatINR } from '@/lib/data';
import StatusBadge from '@/components/account/StatusBadge';
import { formatDate } from '@/components/account/format';

const NEXT_STATUS = {
  paid: { status: 'processing', label: 'Mark as Processing' },
  processing: { status: 'shipped', label: 'Mark as Shipped' },
  shipped: { status: 'delivered', label: 'Mark as Delivered' },
};

export default function ArtisanOrdersPage() {
  const { user, ready, token, logout } = useAuth();
  const router = useRouter();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingId, setUpdatingId] = useState(null);
  const [actionError, setActionError] = useState('');

  const loadOrders = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError('');
    try {
      await api('/seller/me', { token });
      const data = await api('/seller/orders', { token });
      setOrders(Array.isArray(data) ? data : []);
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
      setError(err?.message || 'Failed to load orders.');
    } finally {
      setLoading(false);
    }
  }, [token, router, logout]);

  useEffect(() => {
    if (!ready || !user || !token) return;
    loadOrders();
  }, [ready, user, token, loadOrders]);

  const handleAdvanceStatus = async (orderId, nextStatus) => {
    setActionError('');
    setUpdatingId(orderId);
    try {
      const updated = await api(`/seller/orders/${orderId}/status`, {
        method: 'PATCH',
        body: { status: nextStatus },
        token,
      });
      setOrders((prev) =>
        prev.map((o) =>
          (o.id || o._id) === orderId ? { ...o, status: updated?.status || nextStatus } : o
        )
      );
    } catch (err) {
      setActionError(err?.message || 'Could not update order status.');
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) {
    return (
      <div className="container-page py-14 lg:py-20">
        <p className="text-sm text-brown/60">Loading your orders…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container-page py-14 lg:py-20">
        <div className="max-w-lg border hairline rounded-sm p-8 bg-white/50">
          <h1 className="font-display text-2xl text-brown mb-2">Orders</h1>
          <p role="alert" className="text-sm text-terracotta mb-5">{error}</p>
          <button onClick={loadOrders} className="btn-primary rounded-full px-6 py-2.5 text-sm">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container-page py-12 lg:py-16">
      <div className="mb-10">
        <p className="text-terracotta text-sm mb-2">Artisan Studio</p>
        <h1 className="font-display text-3xl sm:text-4xl text-brown">Orders</h1>
      </div>

      {actionError && (
        <p role="alert" className="text-sm text-terracotta mb-6">{actionError}</p>
      )}

      {orders.length === 0 ? (
        <div className="border hairline rounded-sm p-12 bg-white/50 text-center">
          <ShoppingBag size={36} className="mx-auto text-brown/30 mb-4" strokeWidth={1.3} />
          <h2 className="font-display text-2xl text-brown mb-2">No orders yet</h2>
          <p className="text-sm text-brown/60 mb-6">
            When customers purchase your crafts, their orders will appear here.
          </p>
          <Link href="/artisan/products" className="btn-primary rounded-full px-7 py-3 text-sm inline-block">
            View My Products
          </Link>
        </div>
      ) : (
        <div className="space-y-5">
          {orders.map((order) => {
            const orderId = order.id || order._id;
            const transition = NEXT_STATUS[order.status];
            return (
              <div key={orderId} className="border hairline rounded-sm p-6 bg-white/50">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                  <div>
                    <p className="text-brown font-medium">
                      Order #{order.orderNumber || orderId}
                    </p>
                    <p className="text-xs text-brown/55 mt-0.5">
                      Placed on {formatDate(order.createdAt)}
                      {order.address?.city ? ` · ${order.address.city}` : ''}
                    </p>
                  </div>
                  <StatusBadge status={order.status} />
                </div>

                <div className="divide-y hairline border-y hairline">
                  {(order.items || []).map((item, idx) => (
                    <div key={item.productId || idx} className="flex items-center justify-between py-3 text-sm">
                      <div>
                        <p className="text-brown">{item.name}</p>
                        <p className="text-xs text-brown/55 mt-0.5">
                          Qty {item.qty} · {formatINR(item.price ?? 0)} each
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 mt-5">
                  <p className="text-xs text-brown/55">
                    {order.address?.name ? `Ship to: ${order.address.name}` : ''}
                  </p>
                  {transition ? (
                    <button
                      onClick={() => handleAdvanceStatus(orderId, transition.status)}
                      disabled={updatingId === orderId}
                      className="btn-primary rounded-full px-6 py-2.5 text-sm disabled:opacity-70"
                    >
                      {updatingId === orderId ? 'Updating…' : transition.label}
                    </button>
                  ) : (
                    <span className="text-xs text-brown/55">
                      {order.status === 'delivered' ? 'Order completed' : 'No action available'}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
