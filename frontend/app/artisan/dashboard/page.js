'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Package, ShoppingBag, IndianRupee, Clock, Plus, ArrowRight } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { formatINR } from '@/lib/data';
import StatusBadge from '@/components/account/StatusBadge';
import { formatDate } from '@/components/account/format';

export default function ArtisanDashboardPage() {
  const { user, ready, token, logout } = useAuth();
  const router = useRouter();

  const [overview, setOverview] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadDashboard = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError('');
    try {
      const me = await api('/seller/me', { token });
      setProfile(me);
      const [overviewData, ordersData] = await Promise.all([
        api('/seller/overview', { token }),
        api('/seller/orders', { token }),
      ]);
      setOverview(overviewData);
      setRecentOrders(Array.isArray(ordersData) ? ordersData.slice(0, 5) : []);
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
      setError(err?.message || 'Could not load your dashboard. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [token, router, logout]);

  useEffect(() => {
    if (!ready || !user || !token) return;
    loadDashboard();
  }, [ready, user, token, loadDashboard]);

  if (loading) {
    return (
      <div className="container-page py-14 lg:py-20">
        <p className="text-sm text-brown/60">Loading your studio dashboard…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container-page py-14 lg:py-20">
        <div className="max-w-lg border hairline rounded-sm p-8 bg-white/50">
          <h1 className="font-display text-2xl text-brown mb-2">Artisan Dashboard</h1>
          <p role="alert" className="text-sm text-terracotta mb-5">{error}</p>
          <button onClick={loadDashboard} className="btn-primary rounded-full px-6 py-2.5 text-sm">
            Retry
          </button>
        </div>
      </div>
    );
  }

  const stats = [
    { label: 'Total Products', value: overview?.totalProducts ?? 0, icon: Package },
    { label: 'Orders Received', value: overview?.totalOrders ?? 0, icon: ShoppingBag },
    { label: 'Revenue', value: formatINR(overview?.revenue ?? 0), icon: IndianRupee },
    { label: 'Pending Orders', value: overview?.pendingOrders ?? 0, icon: Clock },
  ];

  const isEmpty = (overview?.totalProducts ?? 0) === 0 && recentOrders.length === 0;

  return (
    <div className="container-page py-12 lg:py-16">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
        <div>
          <p className="text-terracotta text-sm mb-2">Artisan Studio</p>
          <h1 className="font-display text-3xl sm:text-4xl text-brown">
            {profile?.name || 'Dashboard'}
          </h1>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/artisan/products"
            className="btn-primary rounded-full px-6 py-2.5 text-sm inline-flex items-center gap-2"
          >
            <Plus size={15} /> Add product
          </Link>
          <Link
            href="/artisan/orders"
            className="btn-outline rounded-full px-6 py-2.5 text-sm inline-flex items-center gap-2"
          >
            View orders <ArrowRight size={15} />
          </Link>
        </div>
      </div>

      {/* Overview cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-12">
        {stats.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className="border hairline rounded-sm p-6 bg-white/50">
              <div className="flex items-center justify-between text-brown/55 mb-3">
                <span className="text-xs uppercase tracking-wider">{item.label}</span>
                <Icon size={17} strokeWidth={1.6} className="text-terracotta" />
              </div>
              <p className="font-display text-3xl text-brown">{item.value}</p>
            </div>
          );
        })}
      </div>

      {isEmpty ? (
        <div className="border hairline rounded-sm p-10 bg-white/50 text-center">
          <Package size={34} className="mx-auto text-brown/30 mb-4" strokeWidth={1.3} />
          <h2 className="font-display text-2xl text-brown mb-2">Your studio is ready</h2>
          <p className="text-sm text-brown/60 mb-6 max-w-md mx-auto">
            Add your first handmade product so customers can discover your craft and place orders.
          </p>
          <Link href="/artisan/products" className="btn-primary rounded-full px-7 py-3 text-sm inline-block">
            Add your first product
          </Link>
        </div>
      ) : (
        <div className="border hairline rounded-sm bg-white/50">
          <div className="flex items-center justify-between px-6 py-5 border-b hairline">
            <h2 className="font-display text-2xl text-brown">Recent Orders</h2>
            <Link href="/artisan/orders" className="text-sm text-terracotta hover:underline">
              See all
            </Link>
          </div>

          {recentOrders.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-sm text-brown/60 mb-4">No orders received yet.</p>
              <Link href="/artisan/products" className="btn-outline rounded-full px-6 py-2.5 text-sm inline-block">
                Manage products
              </Link>
            </div>
          ) : (
            <div className="divide-y hairline">
              {recentOrders.map((order) => {
                const orderId = order.id || order._id;
                const itemCount = (order.items || []).reduce((sum, it) => sum + (it.qty || 0), 0);
                return (
                  <div key={orderId} className="px-6 py-4 flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <p className="text-sm text-brown font-medium">
                        Order #{order.orderNumber || orderId}
                      </p>
                      <p className="text-xs text-brown/55 mt-0.5">
                        {formatDate(order.createdAt)} · {itemCount} {itemCount === 1 ? 'item' : 'items'}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <StatusBadge status={order.status} />
                      <Link href="/artisan/orders" className="text-xs text-terracotta hover:underline">
                        Manage
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
