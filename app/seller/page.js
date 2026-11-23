'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import LoginRequired from '@/components/account/LoginRequired';
import OverviewTab from '@/components/seller/OverviewTab';
import ProductsTab from '@/components/seller/ProductsTab';
import OrdersTab from '@/components/seller/OrdersTab';
import InventoryTab from '@/components/seller/InventoryTab';

const TABS = [
  ['overview', 'Overview'],
  ['products', 'Products'],
  ['orders', 'Orders'],
  ['inventory', 'Inventory'],
];

export default function SellerDashboardPage() {
  const { user, token, ready } = useAuth();
  const [tab, setTab] = useState('overview');
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  // Loads everything the dashboard needs. Called again after every change.
  const load = useCallback(async () => {
    try {
      const [products, orders, inventory, categories] = await Promise.all([
        api('/seller/products', { token }),
        api('/seller/orders', { token }),
        api('/seller/inventory', { token }),
        api('/categories'),
      ]);
      setData({ products, orders, inventory, categories });
      setError('');
    } catch (e) {
      setError(e.message);
    }
  }, [token]);

  useEffect(() => {
    if (token && user && user.role === 'artisan') load();
  }, [token, user, load]);

  if (ready && !user) {
    return <LoginRequired next="/seller" title="Please log in to your artisan account" text="The seller dashboard is for artisans. Log in to manage your products and orders." />;
  }

  if (user && user.role !== 'artisan') {
    return (
      <div className="container-page py-24 text-center">
        <h1 className="font-display text-3xl text-brown mb-3">This area is for artisan accounts</h1>
        <p className="text-brown/60 mb-8">You are logged in as a customer. Log in with an artisan account to open the seller dashboard.</p>
        <Link href="/shop" className="btn-primary rounded-full px-8 py-3 text-sm inline-block">Back to the shop</Link>
      </div>
    );
  }

  return (
    <div className="container-page py-12 lg:py-16">
      <div className="max-w-lg mb-8">
        <p className="text-terracotta text-sm mb-2">Seller Dashboard</p>
        <h1 className="font-display text-4xl text-brown">Welcome{user ? `, ${user.name}` : ''}</h1>
        <p className="text-brown/65 mt-4 leading-relaxed">Manage your products, orders and stock in one place.</p>
      </div>

      <div className="flex gap-8 border-b hairline mb-10 overflow-x-auto">
        {TABS.map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`pb-3 text-sm whitespace-nowrap border-b-2 -mb-px transition-colors ${tab === key ? 'border-terracotta text-terracotta' : 'border-transparent text-brown/55 hover:text-brown'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {error && <p role="alert" className="text-sm text-terracotta mb-6">{error}</p>}
      {!data && !error && <p className="text-sm text-brown/55">Loading your dashboard…</p>}

      {data && tab === 'overview' && <OverviewTab {...data} goTo={setTab} />}
      {data && tab === 'products' && <ProductsTab products={data.products} categories={data.categories} token={token} reload={load} />}
      {data && tab === 'orders' && <OrdersTab orders={data.orders} token={token} reload={load} />}
      {data && tab === 'inventory' && <InventoryTab inventory={data.inventory} token={token} reload={load} />}
    </div>
  );
}
